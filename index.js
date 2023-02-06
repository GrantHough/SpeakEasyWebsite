const azureLink = "https://speakeasy.azurewebsites.net/"; //base link for azure paas server
var lastTrigger = 0; //index for keeping track of how many cycles of n milliseconds it has been since last trigger of server call
var lastText = ""; //most recent text for the edtior box before new trigger
var triggerThreshold = 5; //threshold for how many times the n millisecond loop must continue without any text change before a server call
var loopTime = 5500; //milliseconds before loop recurses
var rejectedSet = new Set();
var originalSentencesSet = new Set();
var rephrasedSentencesSet = new Set();

//prevent text in the editor box from being too long
$("#homepage-editor").on("input keypress paste", function(event) {  
    if ($(this).text().length > 420) {
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
    $.get("errorPopup.html", function (errorPopupData) {
    //get rid of excessive spaces, might be erroneous, check this out later
    var text = $("#homepage-editor").text().replaceAll("   ", "");
    text = text.replaceAll("\n", "");
    
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

                //clear old things
                $("#error-content").empty();

                var errorIndex = 1;
                var hasErrors = false;
                var originalSentences = response.original;
                var rephrasedSentences = response.rephrased;
                //looping through them all to check if there are changes ie something was rephrased
                for (var i = 0; i < originalSentences.length; i++) {
                    console.log(originalSentences[i] != rephrasedSentences[i]);
                    console.log(!rejectedSet.has(originalSentences[i]));
                    
                    if (originalSentences[i] != rephrasedSentences[i] && !rejectedSet.has(originalSentences[i])) {

                        var newErrorPopupData = errorPopupData;
                        var originalSentence = originalSentences[i];
                        var rephrasedSentence = rephrasedSentences[i];
                        newErrorPopupData = newErrorPopupData.replaceAll('ERRORINDEXHERE', errorIndex);
                        newErrorPopupData = newErrorPopupData.replaceAll('ORIGNALSENTENCEHERE', originalSentence);
                        newErrorPopupData = newErrorPopupData.replaceAll('REPHRASEDSENTENCEHERE', rephrasedSentence);
                        //Appending errorContent with functionality
                        $("#error-content").append(newErrorPopupData);
                        popupErrorButtonsLogic(errorIndex);
                        errorIndex++;

                        //There are now errors
                        hasErrors = true;
                        
                    }  
                }
                if (hasErrors) {
                    console.log('has errors');
                    $("#error-content").removeClass('hidden');
                    $("#default-content").addClass('hidden');
                    $("#homepage-editor-logo").attr('src', 'images/transparentrednobackground.png');

                } else {
                    console.log('no has errors');
                    $("#error-content").addClass('hidden');
                    $("#default-content").removeClass('hidden');
                    $("#homepage-editor-logo").attr('src', 'images/whitelogonobackground.png');

                }
            }
        );

    } else {
        lastTrigger++;
    }  
    })
});


function popupErrorButtonsLogic(errorIndex) {

    //Accepting change
    $("#accept-btn[error-index='"+ errorIndex + "']").on("click", function() {
        
        realErrorIndex = $(this).attr('error-index');
        
        var editor = $("#homepage-editor");
        var editorText = editor.text();
        var originalSentence = $(".original-sentence[error-index='"+ realErrorIndex + "']").text();
        var rephrasedSentence = $(".rephrased-sentence[error-index='"+ realErrorIndex + "']").text();
        
        //add sentences to set
        originalSentencesSet.add(originalSentence);
        rephrasedSentencesSet.add(rephrasedSentence);

        //Replace original with rephrased
        if (editorText.includes(originalSentence)) {
            editorText = editorText.replace(originalSentence, rephrasedSentence);
            $(editor).text(editorText);

            //Begone
            $("#error-popup[error-index='"+ realErrorIndex + "']").remove();

            //Checking if last popup error resolved
            var errorContentChildren = $("#error-content").children().length;
            if (errorContentChildren <= 0) {
                $("#error-content").addClass('hidden');
                $("#default-content").removeClass('hidden');
                $("#homepage-editor-logo").attr('src', 'images/whitelogonobackground.png');
            }

            //the logic for when the sentence isnt there was too complicated, this is fine for now
        } else {
            $("#error-popup[error-index='"+ realErrorIndex + "']").remove();
        }

    });

    //Ignoring change
    $("#ignore-btn[error-index='"+ errorIndex + "']").on("click", function() {

        realErrorIndex = $(this).attr('error-index');
        //Add to rejected list
        var originalSentence = $(".original-sentence[error-index='"+ realErrorIndex + "']").text();
        rejectedSet.add(originalSentence);

        //Begone
        $("#error-popup[error-index='"+ realErrorIndex + "']").remove();

        //Checking if last popup error resolved
        var errorContentChildren = $("#error-content").children().length;
        if (errorContentChildren <= 0) {
            $("#error-content").addClass('hidden');
            $("#default-content").removeClass('hidden');
            $("#homepage-editor-logo").attr('src', 'images/whitelogonobackground.png');
        }

    });

    //rephrase new option
    $("#rephrase-btn[error-index='"+ errorIndex + "']").on("click", function() {

        realErrorIndex = $(this).attr('error-index');
        var originalSentence = $(".original-sentence[error-index='"+ realErrorIndex + "']").text();
        var rephrasedSentence = $(".rephrased-sentence[error-index='"+ realErrorIndex + "']");
        
        //add loading animation
        $("#speakeasy-error-items[error-index='"+ errorIndex + "']").addClass('hidden');
        $("#speakeasy-error-loading[error-index='"+ errorIndex + "']").removeClass('hidden');

        var serverCall = contactServerRephrase(originalSentence, azureLink + 'newsentence')
            .catch((error) => {
                console.log(error);
            })
            .then(response => {
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

