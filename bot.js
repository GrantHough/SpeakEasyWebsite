
let users = $("#users");
let servers = $("#servers");
let sentences = $("#sentences");

const serverLink = "https://speakeasy-367001-default-rtdb.firebaseio.com/speakeasybot/general_data/.json?auth=Rc0ZwbYSkQRIxI0c6QnMZVGnguLxDvy9l710bQy3;"

updateValues();

async function updateValues() {

    return fetch(serverLink+"bot-stats").then(results => {
        return results.json();
    }).then(stats => {
        console.log(stats);
    });

}
