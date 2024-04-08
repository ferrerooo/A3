
window.addEventListener('load', function () {
  // This function will run after the entire page is fully loaded
  console.log('The entire page has loaded for Claude');
  init();
});

function init() {

  /*chrome.storage.local.get('isDataReadyToShare', function(data) {
    console.log('isDataReadyToShare = ' + data.isDataReadyToShare);
  });*/

  let userInput = null;
  let submitBtn = null;
  let userInputObserver = null;
  let isReadyToSetupSubmitBtnListener = true;
  let isUserInputFromOtherAI = false;

  setupUserInputObserver();
  setupReplyObserver();


  function doChat() {
    console.log("Asked question: " + userInput.textContent);
  }

  function shareDataAcrossAI() {
    console.log("Claude>>>>>>" + userInput.textContent + " is saved to chrome.storage");
    chrome.storage.local.set({ whatUserSaid: "Claude>>>>>>" + userInput.textContent });
  }

  function onContentChange() {
    console.log('Input questions: ' + userInput.textContent);
    if (userInput.textContent && isReadyToSetupSubmitBtnListener) {
      // need to wait a bit so that the button retrieved would be the one for the next user click; immediate retrieved button is not the one user will click.
      setTimeout(setupSubmitBtnListener, 1); // wait for only 1ms just works.
      isReadyToSetupSubmitBtnListener = false;
    }
  }

  function setupUserInputObserver(retries = 10, delay = 1000) {
    // If the observer already exists, disconnect it
    if (userInputObserver) {
      userInputObserver.disconnect();
    }

    // Attempt to select the .ProseMirror p element
    userInput = document.querySelector('.ProseMirror p');

    // If the element is found, setup the observer
    if (userInput) {
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

  function setupSubmitBtnListener() {

    submitBtn = document.querySelector('button.rounded-xl.cursor-pointer');   // document.querySelector('button.rounded-xl.cursor-pointer svg[viewBox="0 0 256 256"]'); // example to do document element selection

    if (submitBtn == null) {
      submitBtn = document.querySelector('button[aria-label="Send Message"]');
    }

    if (submitBtn == null) {
      alert("Error: Submit btn not found");
      return;
    }

    console.log('setupSubmitBtnListener...');

    submitBtn.addEventListener("click", function () {
      doChat();
      shareDataAcrossAI();
      isReadyToSetupSubmitBtnListener = true;
    });

    if (isUserInputFromOtherAI) {
      submitBtn.click();
      isUserInputFromOtherAI = false;
    }
  }

  /*
  for Claude, userInput box and submitBtn are kept refreshing. 
  So it needs to find out the time when the correct DOM elements are loaded, and then setup observer or listener to them.
  For userInput element, it is ready when claude's reply completes; so setupUserInputObserver() is called when isReplyComplete;
  For submitBtn element, it is ready when user starts to type in characters; so setupSubmitBtnListener() is called when onContentChange() is called;
  */

  function setupReplyObserver() {
    const replyConfig = {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    };

    const replyObserver = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            checkLink(node);
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkLink(mutation.target);
        }
      }
    });

    replyObserver.observe(document.body, replyConfig);

    /*
    Based on the observation of how claude works, when link of "Claude can make mistakes. Please double-check responses." shows up, the userInput element is ready.
    */
    function checkLink(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches('a[data-state="closed"][href="https://support.anthropic.com/en/articles/8525154-claude-is-providing-incorrect-or-misleading-responses-what-s-going-on"]')) {
          const isReplyComplete = node.classList.contains('opacity-100') && node.classList.contains('duration-700');
          const isReplyOngoing = node.classList.contains('opacity-0') && node.classList.contains('duration-0');

          if (isReplyComplete) {
            console.log('Claude reply complete.');
            setupUserInputObserver();
          } else if (isReplyOngoing) {
            console.log('Claude reply starts.');
          } else {
            console.error('unknown reply status.');
          }
        }
      }
    }
  }



  chrome.storage.onChanged.addListener(function (changes, namespace) {

    console.log('chrome.storage.onChanged triggered.');

    chrome.storage.local.get('whatUserSaid', function (data) {

      let fromAI = data.whatUserSaid.split(">>>>>>")[0];
      let whatSaid = data.whatUserSaid.split(">>>>>>")[1];
      if (fromAI !== "Claude") {
        console.log('whatUserSaid = ' + whatSaid + " from " + fromAI);
        userInput.textContent = whatSaid;
        isUserInputFromOtherAI = true;
      } else {
        console.log("chrome.storage.onChanged is from the current AI: " + fromAI);
      }
    });

  });

}

