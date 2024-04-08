window.addEventListener('load', function () {
  // This function will run after the entire page is fully loaded
  console.log('The entire page has loaded for ChatGPT');
  init();
});

function init() {

  console.log("init...");

  let userInput = null;
  let submitBtn = null;
  let isUserInputFromOtherAI = false;

  setupUserInputListener();
  setupSubmitBtnListener();

  function doChat() {
    console.log("Asked question: " + userInput.value);

  }

  function shareDataAcrossAI() {
    console.log("ChatGPT>>>>>>" + userInput.value + " is saved to chrome.storage");
    chrome.storage.local.set({ whatUserSaid: "ChatGPT>>>>>>" + userInput.value });
  }


  function onContentChange() {
    console.log('Input questions: ' + userInput.value);
  }

  /*
  for ChatGPT, userInput element is straightforward. Looks it does not refresh, so the initial listener setting works and it is enough.
  */
  function setupUserInputListener() {
    userInput = document.getElementById("prompt-textarea");

    if (!userInput) {
      alert("userInput is not found.");
      return;
    } else {
      console.log("userInput found.");
    }

    userInput.addEventListener("input", function () {
      onContentChange();
    });
  }

  /*
  for ChatGPT, the next submitBtn will be ready about 2 seconds after the current submitBtn is clicked.
  */
  function setupSubmitBtnListener(retries = 10, delay = 1000) {

    submitBtn = document.querySelector('button[data-testid="send-button"]');

    if (submitBtn) {
      console.log('setup submitBtn listener...');
      submitBtn.addEventListener("click", function () {
        doChat();

        if (!isUserInputFromOtherAI) {
          shareDataAcrossAI();
        } else {
          isUserInputFromOtherAI = false;
        }
        
        // without this wait but call setupSubmitBtnListener directly, the submitBtn will be get, after which the submitBtn will be refreshed. So here needs setTimeout.
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

    chrome.storage.local.get('whatUserSaid', function (data) {

      let fromAI = data.whatUserSaid.split(">>>>>>")[0];
      let whatSaid = data.whatUserSaid.split(">>>>>>")[1];
      if (fromAI !== "ChatGPT") {
        console.log('whatUserSaid = ' + whatSaid + " from " + fromAI);
        userInput.value = whatSaid;

        isUserInputFromOtherAI = true;
        submitBtn.disabled = true;
        submitBtn.click();

      } else {
        console.log("chrome.storage.onChanged is from the current AI: " + fromAI);
      }
    });

  });


}
