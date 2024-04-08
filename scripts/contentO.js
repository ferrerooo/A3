/*
This is ChatGPT.
*/

window.addEventListener('load', function () {
  // This function will run after the entire page is fully loaded
  console.log('The entire page has loaded for ChatGPT');
  init();
});

function init() {

  console.log("init...");

  let userInput = null;
  let submitBtn = null;
  let isUserOnThisAI = true;
  let isSubmitBtnClicked = false;

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
    console.log("Asked question: " + userInput.value);

  }

  function shareDataAcrossAI() {
    console.log(`ChatGPT>>>>>> ${userInput.value} is saved to chrome.storage, which is to be shared with others.`);
    chrome.storage.local.set({ whatUserSaid: "ChatGPT>>>>>>" + userInput.value });
  }

  function setSubmitFlag() {
    isSubmitBtnClicked = true;
    console.log(`SubmitBtn-click by ChatGPT is saved to chrome.storage, which is to be shared with others.`);
    chrome.storage.local.set({ submittedBy: "ChatGPT_" + new Date()});
  }


  function onContentChange() {
    console.log(`Input questions: ${userInput.value}`);

    if (isUserOnThisAI && !isSubmitBtnClicked) {
      shareDataAcrossAI();
    } 

    if (isSubmitBtnClicked) {
      isSubmitBtnClicked = false;
    }
  }

  /*
  for ChatGPT, userInput element is straightforward. 
  Looks it does not refresh, so the initial listener setting works and it is enough.
  Add retry logic to improve robustness.
  */
  function setupUserInputListener(retries = 10, delay = 1000) {

    userInput = document.getElementById("prompt-textarea");

    if (userInput) {
      console.log("setup userInput listener...");
      userInput.addEventListener("input", function () {
        onContentChange();
      });
    } else if (retries > 0) {
      console.log(`userInput not found, retrying in ${delay} ms. Retries left: ${retries - 1}`);
      setTimeout(() => setupUserInputListener(retries - 1, delay * 1), delay);
    } else {
      console.error("Failed to find the userInput.");
    }
  }

  /*
  for ChatGPT, the next submitBtn will be ready about 2 seconds after the current submitBtn is clicked.
  */
  function setupSubmitBtnListener(retries = 10, delay = 1000) {

    submitBtn = document.querySelector('button[data-testid="send-button"]');

    if (submitBtn) {
      console.log('setup submitBtn listener...');
      submitBtn.addEventListener("click", function () {
        
        console.log(`================== submitBtn click event happened : ${submitBtn}========================`);
        
        doChat();

        if (isUserOnThisAI) {
          setSubmitFlag();
        }

        // without this wait but call setupSubmitBtnListener directly, 
        // the submitBtn will be get, after which the submitBtn will be refreshed. So here needs setTimeout.
        setTimeout(setupSubmitBtnListener, 1);
      });

    } else if (retries > 0) {
      console.log(`submitBtn not found, retrying in ${delay} ms. Retries left: ${retries - 1}`);
      setTimeout(() => setupSubmitBtnListener(retries - 1, delay * 1), delay);
    } else {
      console.error("Failed to find the submitBtn.");
    }

  }

  chrome.storage.onChanged.addListener(function (changes, namespace) {
    console.log('chrome.storage.onChanged triggered.');
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {

      if (key === "whatUserSaid") {
        console.log("chrome.storage.onChanged.addListener >>> key === whatUserSaid Triggered");
        onUserInputUpdate();
      } else if (key === "submittedBy") {
        console.log("chrome.storage.onChanged.addListener >>> key === submittedBy Triggered");
        onSubmitBtnClicked();
      }   
    }
  });

  function onUserInputUpdate() {
    chrome.storage.local.get('whatUserSaid', function (data) {

      let fromAI = data.whatUserSaid.split(">>>>>>")[0];
      let whatSaid = data.whatUserSaid.split(">>>>>>")[1];
      if (fromAI !== "ChatGPT") {
        console.log(`whatUserSaid = ${whatSaid} from ${fromAI}`);

        userInput.value = whatSaid;
        submitBtn.disabled = false;

      } else {
        console.log(`chrome.storage.onChanged userInput-updated is from the current AI: ${fromAI}, so no further actions.`);
      }
    });
  }

  function onSubmitBtnClicked() {
    chrome.storage.local.get('submittedBy', function (data) {

      let subBy = data.submittedBy;
      if (!subBy.startsWith("ChatGPT")) {
        console.log(`onSubmitBtnClicked() >>> submitBtn is clicked by ${subBy}`);
        
        setupSubmitBtnListener();
          
        setTimeout(submitBtn.click, 5000);

      } else {
        console.log(`onSubmitBtnClicked() >>> chrome.storage.onChanged submitBtn-click is from the current AI: ${subBy}, so no further actions.`);
      }
    });
  }


}
