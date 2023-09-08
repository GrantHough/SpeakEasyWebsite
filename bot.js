
let users = $("#users");
let servers = $("#servers");
let sentences = $("#sentences");

const serverLink = "https://speakeasyserver-vkd5vb5lca-uc.a.run.app/";

updateValues();

async function updateValues() {

    return fetch(serverLink+"bot-stats").then(results => {
        return results.json();
    }).then(stats => {
        // console.log(stats);
        let userCount = addCommas(stats.data.users);
        let serverCount = addCommas(stats.data.servers);
        let sentenceCount = addCommas(stats.data.rated);

        users.html(userCount + " users");
        servers.html(serverCount + " servers");
        sentences.html(sentenceCount + " sentences rated")

    });

}


function addCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
