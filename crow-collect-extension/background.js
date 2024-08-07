// const repoUrl = 'https://github.com/holyMolyTolli/crow-collect/blob/main/crow-collect-extension.zip'; // URL to your repo ZIP
// const extensionFolder = 'crow-collect-extension';
// const checkInterval = 60 * 60 * 1000; // Check every hour

// async function checkForUpdates() {
//     const response = await fetch(repoUrl, {
//         method: 'HEAD'
//     });
//     const lastModified = response.headers.get('last-modified');

//     const lastChecked = await getLastCheckedTime();
//     if (new Date(lastModified) > new Date(lastChecked)) {
//         downloadAndUpdate(lastModified);
//     }
// }

// async function downloadAndUpdate(lastModified) {
//     const response = await fetch(repoUrl);
//     const blob = await response.blob();
//     const url = URL.createObjectURL(blob);

//     chrome.downloads.download({
//         url: url,
//         filename: 'extension.zip', // Name of the downloaded file
//         conflictAction: 'overwrite'
//     }, async (downloadId) => {
//         console.log('Download completed:', downloadId);
//         // Optionally, you could programmatically unzip and load the extension,
//         // but this typically requires user interaction for security reasons.
//         await setLastCheckedTime(lastModified);
//     });
// }

// function getLastCheckedTime() {
//     return new Promise((resolve, reject) => {
//         chrome.storage.local.get(['lastChecked'], function(result) {
//             resolve(result.lastChecked || '1970-01-01T00:00:00Z');
//         });
//     });
// }

// function setLastCheckedTime(time) {
//     return new Promise((resolve, reject) => {
//         chrome.storage.local.set({lastChecked: time}, function() {
//             resolve();
//         });
//     });
// }

// setInterval(checkForUpdates, checkInterval);
// checkForUpdates(); // Initial check
