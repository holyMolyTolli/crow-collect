var endpoint = "https://holymolytolli--backend-receipt-collector-endpoint-py-04cd48-dev.modal.run/";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;

    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getUserId() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["userId"], function (result) {
      if (result.userId) {
        resolve(result.userId);
      } else {
        var userId = generateUUID();
        chrome.storage.local.set({ userId: userId }, function () {
          resolve(userId);
        });
      }
    });
  });
}

async function getCookiesForCurrentUrl(url) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ url: url }, function (cookies) {
      resolve(cookies);
    });
  });
}

async function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      resolve(tabs[0]);
    });
  });
}

function getExtensionId() {
  console.log("Extension runtime:", chrome.runtime);
  return chrome.runtime.id;
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

function createHomepageEntry(hostname, timestamp) {
  const entryDiv = document.createElement("div");
  entryDiv.className = "homepage-entry";

  const homepageButton = document.createElement("button");
  homepageButton.className = "homepage-button";
  homepageButton.textContent = hostname;
  homepageButton.onclick = function () {
    window.open(`http://${hostname}`, "_blank");
  };

  const updateInfo = document.createElement("span");
  updateInfo.className = "update-info";
  updateInfo.textContent = "Last Cookie Update:";
  const breakElement = document.createElement("br");
  updateInfo.appendChild(breakElement);
  const timeText = document.createTextNode(`${timeSince(new Date(timestamp))}`);
  updateInfo.appendChild(timeText);

  entryDiv.appendChild(homepageButton);
  entryDiv.appendChild(updateInfo);

  return entryDiv;
}

async function handleConnectButtonClick() {
  const activeTab = await getActiveTab();
  console.log("activeTab:", activeTab);
  const url = activeTab.url;
  console.log("url:", url);
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  console.log("hostname:", hostname);
  const cookies = await getCookiesForCurrentUrl(url);
  const userId = getExtensionId(); // = await getUserId();
  console.log("cookies:", cookies);

  try {
    response = await fetch(endpoint + "send_cookies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        hostname: hostname,
        url: url,
        cookies: cookies,
      }),
    });
    data = await response.json();
    var newlyConnectedHomepage = data.response;

    const connectedHomepagesContainer = document.getElementById("connectedHomepages");
    const entryDiv = createHomepageEntry(newlyConnectedHomepage.hostname, newlyConnectedHomepage.timestamp);
    const existingEntry = Array.from(connectedHomepagesContainer.querySelectorAll(`div.homepage-entry`)).find((el) => el.querySelector("button.homepage-button").textContent.includes(newlyConnectedHomepage.hostname));

    if (existingEntry) {
      console.log("Replacing existing entry");
      console.log(existingEntry, entryDiv);
      connectedHomepagesContainer.replaceChild(entryDiv, existingEntry);
    } else {
      connectedHomepagesContainer.appendChild(entryDiv);
    }

    document.getElementById("connectButton").textContent = `Update ${hostname}`;
  } catch (error) {
    console.error("Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const loaderContainer = document.getElementById("loaderContainer");
  const loader = document.createElement("div");
  loader.className = "loader";
  loaderContainer.appendChild(loader);
  loaderContainer.style.display = "flex";

  const currentActiveTab = await getActiveTab();
  const currentUrl = currentActiveTab.url;
  const currentUrlObj = new URL(currentUrl);
  const currentHostname = currentUrlObj.hostname;
  const userId = getExtensionId(); // = await getUserId();

  const connectedHomepagesContainer = document.getElementById("connectedHomepages");
  const buttonContainer = document.getElementById("connectButtonContainer");

  const response = await fetch(endpoint + "get_connected_homepages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: userId }),
  });
  const data = await response.json();
  const connectedHomepagesSupabase = data.connectedHomepages;

  let isCurrentPageConnected = false;

  connectedHomepagesSupabase.forEach((site) => {
    if (site.hostname === currentHostname) {
      isCurrentPageConnected = true;
    }
    const entryDiv = createHomepageEntry(site.hostname, site.timestamp);
    connectedHomepagesContainer.appendChild(entryDiv);
  });

  const connectButton = document.createElement("button");
  connectButton.className = "connect-button";
  connectButton.id = "connectButton";
  if (!isCurrentPageConnected) {
    connectButton.textContent = `Connect ${currentHostname}`;
  } else {
    connectButton.textContent = `Update ${currentHostname}`;
  }
  buttonContainer.appendChild(connectButton);

  const downloadButton = document.createElement("button");
  downloadButton.className = "download-button";
  downloadButton.id = "downloadButton";
  downloadButton.textContent = `Download Extension`;
  buttonContainer.appendChild(downloadButton);

  loaderContainer.style.display = "none";

  document.getElementById("connectButton").addEventListener("click", handleConnectButtonClick);

  document.getElementById("downloadButton").addEventListener("click", function () {
    var downloadFolder = "https://api.github.com/repos/holyMolyTolli/crow-collect/contents/crow-collect-extension?ref=main";
    var destinationFolder = "crow-collect-extension";
    downloadAndUpdate(downloadFolder, destinationFolder);

    var downloadFolder = "https://api.github.com/repos/holyMolyTolli/crow-collect/contents/crow-collect-extension/images?ref=main";
    var destinationFolder = "crow-collect-extension/images";
    downloadAndUpdate(downloadFolder, destinationFolder);
  });
});

async function fetchFilesFromGitHub(apiUrl) {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching files:", error);
    throw error;
  }
}

async function downloadAndUpdate(githubRepoContentsUrl, destinationFolder) {
  console.log("Starting download process...");

  try {
    console.log("Fetching files data...");
    const filesData = await fetchFilesFromGitHub(githubRepoContentsUrl);

    for (const file of filesData) {
      if (file.type === "file" && file.download_url) {
        console.log(`Processing file: ${file.name}`);
        chrome.downloads.download(
          {
            url: file.download_url,
            filename: `${destinationFolder}/${file.name}`, // This will save in 'Downloads/crow-collect-extension/'
            conflictAction: "overwrite",
            saveAs: false,
          },
          function (downloadId) {
            if (chrome.runtime.lastError) {
              console.error("Error downloading file:", chrome.runtime.lastError);
            } else {
              console.log(`Download initiated for ${file.name}, ID: ${downloadId}`);
            }
          },
        );
      }
    }
  } catch (error) {
    console.error("Error during file download and save:", error);
  }
}
