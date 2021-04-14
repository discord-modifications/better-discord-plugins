/**
 * @name UploadFromLinks
 * @source https://github.com/slow/better-discord-plugins/blob/master/UploadFromLinks/UploadFromLinks.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/UploadFromLinks/UploadFromLinks.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/UploadFromLinks/UploadFromLinks.plugin.js
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

/*@cc_on
@if (@_jscript)
	
   // Offer to self-install for clueless users that try to run this directly.
   var shell = WScript.CreateObject('WScript.Shell');
   var fs = new ActiveXObject('Scripting.FileSystemObject');
   var pathPlugins = shell.ExpandEnvironmentStrings('%APPDATA%\BetterDiscord\plugins');
   var pathSelf = WScript.ScriptFullName;
   // Put the user at ease by addressing them in the first person
   shell.Popup('It looks like you've mistakenly tried to run me directly. \n(Don't do that!)', 0, 'I'm a plugin for BetterDiscord', 0x30);
   if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
      shell.Popup('I'm in the correct folder already.', 0, 'I'm already installed', 0x40);
   } else if (!fs.FolderExists(pathPlugins)) {
      shell.Popup('I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?', 0, 'Can't install myself', 0x10);
   } else if (shell.Popup('Should I copy myself to BetterDiscord's plugins folder for you?', 0, 'Do you need some help?', 0x34) === 6) {
      fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
      // Show the user where to put plugins in the future
      shell.Exec('explorer ' + pathPlugins);
      shell.Popup('I'm installed!', 0, 'Successfully installed', 0x40);
   }
   WScript.Quit();

@else@*/

const { findModuleByProps } = BdApi;
const messages = findModuleByProps('sendMessage', 'editMessage', 'deleteMessage');
const { get } = require('request');
const { readFileSync } = require('fs');

const config = {
   info: {
      name: 'UploadFromLinks',
      authors: [
         {
            name: 'eternal',
            discord_id: '282595588950982656',
         }
      ],
      version: '1.0.0',
      description: 'Allows you to upload from links by surrounding the link in brackets.',
      github: 'https://github.com/slow/better-discord-plugins/tree/master/UploadFromLinks/UploadFromLinks.plugin.js',
      github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/UploadFromLinks/UploadFromLinks.plugin.js',
   }
};

module.exports = !global.ZeresPluginLibrary ? class {
   getName() {
      return config.info.name;
   }

   getAuthor() {
      return config.info.authors[0].name;
   }

   getVersion() {
      return config.info.version;
   }

   getDescription() {
      return config.info.description;
   }

   load() {
      BdApi.showConfirmationModal('Library Missing', `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
         confirmText: 'Download Now',
         cancelText: 'Cancel',
         onConfirm: () => {
            require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
               if (error) return require('electron').shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
               await new Promise(r => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
            });
         }
      });
   }

   start() { }

   stop() { }
} : (([Plugin, API]) => {
   const { Patcher } = API;

   return class UploadFromLinks extends Plugin {
      constructor() {
         super();
      }

      start() {
         Patcher.before(messages, 'sendMessage', (_, args) => {
            if (this.processMessage(args[0], args[1])) return false;
            return args;
         });
      };

      processMessage(cid, msg) {
         if (!msg.content) return;
         const files = [];
         const search = msg.content.split('[').join('][').split(']');

         for (let i = 0; i < search.length; i++) {
            const arr = search[i].replace('[', '').split(',');
            let name = arr[1] || arr[0].split('/').pop().split('?')[0];

            if (search[i].startsWith('[http')) {
               files.push({ url: arr[0], name });
               msg.content = msg.content.replace(search[i] + ']', '');
            } else if ((process.platform == 'win32' && search[i].match(/^[A-Z]:(\/|\\)/)) ||
               (process.platform != 'win32' && search[i].startsWith('[/'))) {
               if (name.includes('\\')) name = name.split('\\').pop();
               files.push({ path: arr[0], name });
               msg.content = msg.content.replace(search[i] + ']', '');
            }
         }

         if (files.length) this.uploadFiles(cid, msg, files);

         return files.length;
      }

      async uploadFiles(cid, msg, files) {
         const { upload } = findModuleByProps('cancel', 'upload');

         for (let i = 0; i < files.length; i++) {
            let file;

            if (files[i].url) {
               file = new File([await this.getFile(encodeURI(files[i].url))], files[i].name);
            } else {
               file = new File([readFileSync(files[i].path)], files[i].name);
            };

            upload(cid, file, msg);
            msg.content = '';
         }
      }

      async getFile(url) {
         return new Promise(async (resolve, reject) => {
            get(url, { encoding: null }, (err, res, body) => {
               if (err) reject(err);
               resolve(body);
            });
         });
      }

      stop() {
         Patcher.unpatchAll();
      };
   };
})(global.ZeresPluginLibrary.buildPlugin(config));