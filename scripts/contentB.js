/*
This is BingChat.
*/

window.addEventListener('load', function () {
    console.log('The entire page has loaded for BingChat');
    init();
});

function init() {

    console.log('init....');

    let userInput = null;
    let submitBtn = null;
    let isUserOnThisAI = false;

    /* for BingChat, successfully setup userInput and SubmitBtn listeners for one time are good. 
    They are not refreshed afterwards.
    */
    setupUserInputListener();
    setupSubmitBtnListener();

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            isUserOnThisAI = true;
        } else {
            isUserOnThisAI = false;
        }

    });

    function doChat() {
        console.log(`Asked question: ${userInput.value}`);
    }

    function shareDataAcrossAI() {
        console.log(`BingChat>>>>>> ${userInput.value} is saved to chrome.storage, which is to be shared with others.`);
        chrome.storage.local.set({ whatUserSaid: "BingChat>>>>>>" + userInput.value });
    }

    function onContentChange() {
        console.log(`Input question: ${userInput.value}`);

        if (isUserOnThisAI) {
            shareDataAcrossAI();
        }
    }

    function setupUserInputListener(retries = 10, delay = 1000) {

        try {
            userInput = document.querySelector('cib-serp').shadowRoot.querySelector('cib-action-bar').shadowRoot.querySelector('cib-text-input').shadowRoot.querySelector('textarea');
        } catch (error) {
            console.log('userInput not found yet.');
        }

        if (userInput) {
            console.log("userInput listener setup!");
            userInput.addEventListener("input", function () {
                onContentChange();
            });
        } else if (retries > 0) {
            console.log(`userInput not found, retrying in ${delay} ms. Retries left: ${retries - 1}`);
            setTimeout(() => setupUserInputListener(retries - 1, delay * 1), delay); // Exponential backoff
        } else {
            console.error("Failed to find userInput textarea.");
        }
    }

    function setupSubmitBtnListener(retries = 10, delay = 1000) {

        try {
            submitBtn = document.querySelector('cib-serp').shadowRoot.querySelector('cib-action-bar').shadowRoot.querySelector('button[description="Submit"]');
        } catch (error) {
            console.log('submitBtn not found yet.');
        }

        if (submitBtn) {
            console.log("submitBtn listener setup!");
            submitBtn.addEventListener('click', function () {
                doChat();
            });
        } else if (retries > 0) {
            console.log(`submitBtn not found, retrying in ${delay} ms. Retries left: ${retries - 1}`);
            setTimeout(() => setupSubmitBtnListener(retries - 1, delay * 1), delay);
        } else {
            console.error("Failed to find submitBtn.");
        }
    }

    chrome.storage.onChanged.addListener(function (changes, namespace) {

        console.log('chrome.storage.onChanged triggered.');

        chrome.storage.local.get('whatUserSaid', function (data) {

            let fromAI = data.whatUserSaid.split(">>>>>>")[0];
            let whatSaid = data.whatUserSaid.split(">>>>>>")[1];
            if (fromAI !== "BingChat") {
                console.log(`whatUserSaid = ${whatSaid} from ${fromAI}`);

                userInput.value = whatSaid;

            } else {
                console.log(`chrome.storage.onChanged is from the current AI: ${fromAI}, so no further actions.`);
            }
        });

    });

}

