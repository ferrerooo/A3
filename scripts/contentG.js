/*
This is Gemini.
*/

window.addEventListener('load', function () {
    // This function will run after the entire page is fully loaded
    console.log('The entire page has loaded for Gemini');
    init();
});

function init() {

    let userInput = null;
    let submitBtn = null;
    let userInputObserver = null;
    let isUserOnThisAI = false;

    setupUserInputObserver();
    setupSubmitBtnListener();


    function doChat() {
        console.log("Asked question: " + userInput.textContent);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            isUserOnThisAI = true;
        } else {
            isUserOnThisAI = false;
        }

    });

    function shareDataAcrossAI() {
        console.log(`Gemini>>>>>> ${userInput.textContent} is saved to chrome.storage, which is to be shared with others.`);
        chrome.storage.local.set({ whatUserSaid: "Gemini>>>>>>" + userInput.textContent });
    }

    function onContentChange() {
        console.log('Input questions: ' + userInput.textContent);

        if (isUserOnThisAI) {
            shareDataAcrossAI();
        }
    }

    /*
    After Gemini reply, the userInput element is refreshed. So this is called again after submitBtn is clicked;
    */
    function setupUserInputObserver(retries = 10, delay = 1000) {
        // If the observer already exists, disconnect it
        if (userInputObserver) {
            userInputObserver.disconnect();
        }

        // Attempt to select the .ProseMirror p element
        userInput = document.querySelector('div.textarea p');

        // If the element is found, setup the observer
        if (userInput) {
            console.log("Setup userInput observer.");
            userInputObserver = new MutationObserver(function (mutationsList, observer) {
                onContentChange();
            });

            userInputObserver.observe(userInput, {
                childList: true,
                characterData: true,
                subtree: true
            });
        } else if (retries > 0) {
            console.log(`userInput element not found, retrying in ${delay} ms. Retries left: ${retries - 1}`);
            setTimeout(() => setupUserInputObserver(retries - 1, delay * 1), delay); // Exponential backoff
        } else {
            console.error("Failed to find the userInput element for observing after several attempts.");
        }
    }

    /*
    after submitBtn is successfully get and setup click listener, 
    it does not refresh anymore, so the initial submitBtn listener setting works forever.
    */
    function setupSubmitBtnListener(retries = 10, delay = 1000) {

        submitBtn = document.querySelector('button.send-button')

        if (submitBtn) {

            console.log('setupSubmitBtnListener...');
            submitBtn.addEventListener("click", function () {
                doChat();
                setupUserInputObserver();
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
            if (fromAI !== "Gemini") {
                console.log(`whatUserSaid = ${whatSaid} from ${fromAI}`);

                userInput.textContent = whatSaid;

            } else {
                console.log(`chrome.storage.onChanged is from the current AI: ${fromAI}, so no further actions.`);
            }
        });

    });
}


