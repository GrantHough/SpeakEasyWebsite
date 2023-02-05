const azureLink = "https://speakeasy.azurewebsites.net/"; //base link for azure paas server
var lastTrigger = 0; //index for keeping track of how many cycles of n milliseconds it has been since last trigger of server call
var lastText = ""; //most recent text for the edtior box before new trigger
var triggerThreshold = 5; //threshold for how many times the n millisecond loop must continue without any text change before a server call
var loopTime = 4000; //milliseconds before loop recurses
var rejectedSet = new Set();
var hasErrors = false;
var originalSentencesSet = new Set();
var rephrasedSentencesSet = new Set();

//prevent text in the editor box from being too long
$("#homepage-editor").on("input keypress paste", function(event) {  
    if ($(this).html().length > 420) {
        event.preventDefault();
        return false;
    }
});

//recursive function to trigger message to server every n milliseconds
function timer(amount) {
    $("#homepage-editor").trigger('message');
    messageTimeout = setTimeout(() => {
        timer(amount);
        lastTrigger++;
    }, amount);
}

//starting recursive loop for n milliseconds
timer(loopTime);

//listener for message every n milliseconds
$("#homepage-editor").on('message', function() {
    //get rid of excessive spaces, might be erroneous, check this out later
    text = $(this).html().replaceAll("   ", "")
    text = text.replaceAll("\n", "")
    var errorIndex = 1;
    
    // if the text as changed or it has been triggerThreshold * n milliseconds
    if (text != lastText || lastTrigger > triggerThreshold) {

        //setting new value for lastText and resetting last trigger index
        lastText = text;
        lastTrigger = 0;

        var serverCall = contactServerRephrase(text, azureLink + 'rephrase')
            .catch((error) => {
                console.log(error);
            })
            .then(response => {
                originalSentences = response.original;
                rephrasedSentences = response.rephrased;
                //looping through them all to check if there are changes ie something was rephrased
                for (var i = 0; i < originalSentences.length; i++) {
                    if (originalSentences[i] != rephrasedSentences[i]) {
                        $.get("errorPopup.html", function (errorPopupData) {
                            var newErrorPopupData = errorPopupData;
                            newErrorPopupData = newErrorPopupData.replaceAll('ERRORINDEXHERE', errorIndex);
                            newErrorPopupData = newErrorPopupData.replaceAll('ORIGNALSENTENCEHERE', originalSentences[i]);
                            newErrorPopupData = newErrorPopupData.replaceAll('REPHRASEDSENTENCEHERE', rephrasedSentences[i]);
    
                            //Appending errorContent with functionality
                            $("#error-content").append(newErrorPopupData);
                            popupErrorButtonsLogic(0, errorIndex);
                            errorIndex++;
    
                            //There are now errors
                            hasErrors = true;
                        })
                    }  

                    if (hasErrors) {
                                
                        $("#error-content").removeClass('hidden');
                        $("#default-content").addClass('hidden');
                        $("#homepage-editor-logo").css('opacity', '50%');

                    } else {
                        
                        $("#error-content").addClass('hidden');
                        $("#default-content").removeClass('hidden');
                        $("#homepage-editor-logo").css('opacity', '87%');

                    }
                }
            }
        );

    } else {
        lastTrigger++;
    }  
});


function popupErrorButtonsLogic(errorIndex) {

    //Accepting change
    $("#accept-btn[error-index='"+ errorIndex + "']").on("click", function() {
        
        realErrorIndex = $(this).attr('error-index');
        
        var editor = $("homepage-editor");
        var editorText = editor.html();
        var originalSentence = $(".original-sentence[error-index='"+ realErrorIndex + "']").text();
        var rephrasedSentence = $(".rephrased-sentence[error-index='"+ realErrorIndex + "']").text();
        
        //add sentences to set
        originalSentencesSet.add(originalSentence);
        rephrasedSentencesSet.add(rephrasedSentence);

        //Replace original with rephrased
        if (editorText.includes(originalSentence)) {
            editorText = editorText.replace(originalSentence, rephrasedSentence);
            $(AmAl).text(editorText);

            //Begone
            $("#error-popup[error-index='"+ realErrorIndex + "']").remove();

            //Checking if last popup error resolved
            var errorContentChildren = $("#error-content").children().length;
            if (errorContentChildren == 0) {
                $("#error-content").addClass('hidden');
                $("#default-content").removeClass('hidden');
                $("#homepage-editor-logo").css('opacity', '100%');
            }

            //jank, make this a function later, but now ths is fine
        } else {
            //Getting popupError.html dynamically (popup for when a sentence is rephrased)
            $.get(chrome.runtime.getURL('./popupError.html'), function(errorPopupData) {
                $("#speakeasy-error-items[error-index='"+ realErrorIndex + "']").addClass("hidden");
                $("#speakeasy-no-sentence-view[error-index='"+ realErrorIndex + "']").removeClass("hidden");
                
                $("#rephrase-everything-btn[error-index='"+ realErrorIndex + "']").on("click", function() {

                    $("#speakeasy-no-sentence-view[error-index='"+ errorIndex + "']").addClass('hidden');
                    $("#speakeasy-error-loading[error-index='"+ errorIndex + "']").removeClass('hidden');
                    //Sends message to background.js
                    chrome.runtime.sendMessage({message: $(AmAl).text(), easyIndex: realCurEasyIndex, type: 'rephrase'}, function(response) {
    
                        var errorIndex = 1;
                        realCurEasyIndex = response.easyIndex;
                        defaultContent = ".default-content";
                        errorContent = ".error-content";
                        $(errorContent).html("");
                        var hasErrors = false;
    
                        //get rid of old guys
                        $(".error-content").empty();
                        
                        //Looping through the responses
                        for (var i = 0; i < response.rephrased.length; i++) {
    
                            //Checking if at index i, original sentence is not equal to rephrased
                            //In other words, if the sentence got rephrased and it isn't in the rejectedSet
                            if (response.original[i] != response.rephrased[i] && !rejectedSet.has(response.original[i])) {
                        
                                //Replacing placeholders with actual values
    
                                var newErrorPopupData = errorPopupData;
                                newErrorPopupData = newErrorPopupData.replaceAll('EASYINDEXHERE', realCurEasyIndex);
                                newErrorPopupData = newErrorPopupData.replaceAll('ERRORINDEXHERE', errorIndex);
                                newErrorPopupData = newErrorPopupData.replaceAll('ORIGNALSENTENCEHERE', response.original[i]);
                                newErrorPopupData = newErrorPopupData.replaceAll('REPHRASEDSENTENCEHERE', response.rephrased[i]);
                                
                                
                                
                                //Appending errorContent with functionality
                                $(errorContent).append(newErrorPopupData); 
                                gmailPopupErrorButtonsLogic(realCurEasyIndex, errorIndex);
                                errorIndex++;
    
                                //There are now errors
                                hasErrors = true;
    
                            }
                        }
    
                        if (hasErrors) {
                            
                            $(errorContent).removeClass('hidden');
                            $(defaultContent).addClass('hidden');
                            $(".floating-btn").attr('src', 'chrome-extension://'+chrome.runtime.id+'/images/28logored.png');
                            
    
                        } else {
                            
                            $(errorContent).addClass('hidden');
                            $(defaultContent).removeClass('hidden');
                            $(".floating-btn").attr('src', 'chrome-extension://'+chrome.runtime.id+'/images/28logo.png');
    
                        }
                        
                        $("#speakeasy-error-items[error-index='"+ realErrorIndex + "']").removeClass("hidden");
                        $("#speakeasy-error-loading[error-index='"+ errorIndex + "']").addClass('hidden');
                    });
                    
                    //logic for rephrasing everyuthing with loading animation and all
                });
                
            });
            

        
        }



    });

    //Ignoring change
    $("#ignore-btn[error-index='"+ errorIndex + "']").on("click", function() {

        realErrorIndex = $(this).attr('error-index');
        realCurEasyIndex = $(this).attr('easy-index');
        //Add to rejected list
        var originalSentence = $(".original-sentence[error-index='"+ realErrorIndex + "']").text();
        rejectedSet.add(originalSentence);

        //Begone
        $("#error-popup[error-index='"+ realErrorIndex + "']").remove();

        //Checking if last popup error resolved
        var errorContentChildren = $(".error-content").children().length;
        if (errorContentChildren <= 0) {
            $(".error-content").addClass('hidden');
            $(".default-content").removeClass('hidden');
            $(".floating-btn").attr('src', 'chrome-extension://'+chrome.runtime.id+'/images/28logo.png');
        }

    });

    //rephrase new option
    $("#rephrase-btn[error-index='"+ errorIndex + "']").on("click", function() {

        realErrorIndex = $(this).attr('error-index');
        realCurEasyIndex = $(this).attr('easy-index');
        var originalSentence = $(".original-sentence[error-index='"+ realErrorIndex + "']").text();
        var rephrasedSentence = $(".rephrased-sentence[error-index='"+ realErrorIndex + "']");
        //Sends message to background.js
        
        //add loading animation
        $("#speakeasy-error-items[error-index='"+ errorIndex + "']").addClass('hidden');
        $("#speakeasy-error-loading[error-index='"+ errorIndex + "']").removeClass('hidden');

        chrome.runtime.sendMessage({message: originalSentence, easyIndex: realCurEasyIndex, rephrase: true, type: 'rephrase'}, function(response) {
            
           rephrasedSentence.text(response.rephrased[0]);
           $("#speakeasy-error-items[error-index='"+ errorIndex + "']").removeClass('hidden');
           $("#speakeasy-error-loading[error-index='"+ errorIndex + "']").addClass('hidden');

        });


    });


}


//logo opens up the popup
$("#homepage-editor-logo").on("click", function() {
    $("#popup").toggleClass('hidden');
});

$("#close-btn").on("click", function() {
    $("#popup").addClass('hidden');
});




async function sendHttpRequest(method, url, data) {
    var contact = fetch(url, {
        method: method, 
        body: JSON.stringify(data), 
        mode: 'cors',
        headers: data ? {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://granthough.github.io'} : {}
     }).then(async (response) => {
        return (await response.json());
     }) 
    return(await contact);
    
};

async function contactServerRephrase(msg, url) {
        var request = sendHttpRequest('POST', url, { 
            text: msg,
            threshold: 1, 
        }).then(async (responseData) => {
            var dog = await responseData;
            return dog;
        });
        return await request;
}

