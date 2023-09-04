
let users = $("#users");
let servers = $("#servers");
let sentences = $("#sentences");

const serverLink = "https://speakeasyserver-vkd5vb5lca-uc.a.run.app/";

updateValues();

async function updateValues() {

    fetch(serverLink + "firebase-creds", {
        mode: 'cors',
        headers: data ? {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'} : {}
     }).then(async (response) => {
        return (await response.json());
     }).then(async data => {
        return fetch(data.url).then(results => {
            return results.json();
        }).then(stats => {
            console.log(stats);
        });
     });

}
