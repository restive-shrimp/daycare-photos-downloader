// Attaching actions to buttons in the extension card.
const getTodaysPhotosKinderloop = document.getElementById("getTodaysPhotosKinderloop");
const getVisiblePhotosKinderloop = document.getElementById("getVisiblePhotosKinderloop");
const getAllPhotosKinderloop = document.getElementById("getAllPhotosKinderloop");

// Function disables or enables buttons. The buttons should not be active
// on the pages which are not in the application domain and should remain
// inactive when processing (i.e. downloading photos or expanding the feed).
buttonsDisabled = (disabled = true) => {
  document.querySelectorAll('button').forEach((item, i) => {
    item.disabled = disabled;
  });
};

// Universal function to be called to request media by background.js
// Data are coming from getPostNodes injection script within certain timePeriod.
sendBackendRequest = (tab, timePeriod) => {
  chrome.scripting.executeScript({
    target: {
      tabId: tab.id
    },
    func: getPostNodes,
    args: [timePeriod]
  });
};

// Adding event to check if the tab is with application domain.
// If not, the buttons are disabled. Otherwise they are enabled.
chrome.tabs.query({
  active: true,
  lastFocusedWindow: true,
  url: ["https://*.kinderloop.com/*"]
}, tabs => {
  buttonsDisabled(true);
  if (tabs[0]) {
    buttonsDisabled(false);
  }
});

// Handler to pick up today's photos.
getTodaysPhotosKinderloop.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: ["https://*.kinderloop.com/*"]
  });
  sendBackendRequest(tab, 'today');
});

// Handler to pick up feed's photos.
getVisiblePhotosKinderloop.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: ["https://*.kinderloop.com/*"]
  });
  sendBackendRequest(tab, 'feed');
});

// This function returns photos according to the time period passed in request.
// This code is very application specific (i.e. names of the classes from DOM).
// There are 3 modes to download photos:
// 1. 'today' - trying to get today's photos only.
// 2. 'feed' (default) - gets photos from visible feed.
// 3. 'all' - expands feed and download photos once feed is fully expanded.
getPostNodes = (timePeriod = 'feed') => {
  chrome.storage.sync.get("kinderloop_posts_element", ({
    kinderloop_posts_element
  }) => {
    console.log("kinderloop_posts_element value is " + kinderloop_posts_element);

  })
  chrome.storage.sync.get("kinderloop_gallery_class", ({
    kinderloop_gallery_class
  }) => {
    const posts = document.querySelectorAll('.post-content');
    let requestParam = '';
    let photosArray = [];

    switch (timePeriod) {
      case 'today':
        // This is the string which will be used to find posts from today's day.
        // The issues is that month can be written in other format (i.e. other
        // laguage), so it is not universal. Day should be good enough though.
        const todaysDayRecognitionString = 'Sent on 27' //+ (new Date().getDate());
        let postArray = [];
        const latestPostDate = posts[0].querySelector('.sent').textContent;
        for (let k in posts) {
          // Searching all the posts to find the date. Removing whitespaces to
          // reduce chance for mistake.
          if (posts[k].getAttribute) {
            if ((posts[k].querySelector('.sent').textContent.replace(/\s+/g, '')).includes((latestPostDate).replace(/\s+/g, ''))) {
              // The message is found, add content from nailthumb containers to
              // download list.
              let post_images = posts[k].querySelectorAll('.nailthumb-container');
              for (let j in post_images) {
                if (post_images[j].getAttribute) {
                  photosArray.push(post_images[j].getAttribute('href'));
                }
              }
            }
          }
        }
        requestParam = {
          collection: photosArray
        };
        break;
      case 'feed':
        // The most straightforward case which grabs href from visible posts and
        // sends to the background request.
        const photos = document.querySelectorAll('.nailthumb-container');
        for (let k in photos) {
          if (photos[k].getAttribute) {
            photosArray.push(photos[k].getAttribute('href'));
          }
        }
        requestParam = {
          collection: photosArray
        };
        break;
      case 'all':
        $('#posts').infinitescroll('retrieve');
        break;
      default:

    }
    chrome.runtime.sendMessage(requestParam);
  });
}


getAllPhotosKinderloop.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  // First feed must be expanded through injection script.
  // Once there is no more nodes, download images.
  if (tab.id)
    expandFeed(tab.id);

  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: getPhotosNodes,
  //   args: ['all']
  // });
});

// Function executing browser script injecting function in the certain tab.
expandFeed = (tabId) => {
  chrome.scripting.executeScript({
    target: {
      tabId: tabId
    },
    func: expandInjection,
    world: 'MAIN'
  });
}

// Function to expand Kinderloop feed by injecting call to expand function.
// The MutationObserver on NodeList with posts is evaluating if the new posts
// were added. Looking only on NodeLists with length > 1 to avoid empty calls.
expandInjection = () => {
  const initialPostCount = document.querySelectorAll('.post').length;
  let processing = false;
  console.log("INITIAL NUMBER OF POSTS: " + initialPostCount);
  let observer = new MutationObserver(mutations => {
    let insertedPostNodes = false;
    processing = false;
    for (let mutation of mutations) {
      if (mutation.addedNodes.length > 1) {
        insertedPostNodes = Array.from(mutation.addedNodes).some(({
            classList
          }) =>
          classList.contains('post'));
      }
    }
    if (insertedPostNodes) {
      console.log("CURRENT NUMBER OF POSTS: " + document.querySelectorAll('.post').length);

      $('#posts').infinitescroll('retrieve');
      processing = true;


      if(document.querySelectorAll('.post').length > 100)
        return
    }
  });
  observer.observe(document.querySelector('#posts'), {
    childList: true
  });
  $('#posts').infinitescroll('retrieve');
  processing = true;
}
