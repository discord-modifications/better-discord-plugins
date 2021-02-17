/**
 * @name SilentTyping
 * @source https://github.com/slow/better-discord-plugins/blob/main/SilentTyping.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/main/SilentTyping.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/main/SilentTyping.plugin.js
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

const request = require('request');
const fs = require('fs');
const path = require('path');

const config = {
   info: {
      name: 'Silent Typing',
      authors: [
         {
            name: 'eternal',
            discord_id: '282595588950982656',
         }
      ],
      version: '1.0.0',
      description: 'Silences your typing indicator/status.',
      github: 'https://github.com/slow/better-discord-plugins/tree/main/SilentTyping.plugin.js',
      github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/main/SilentTyping.plugin.js',
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
      BdApi.showConfirmationModal('Library plugin is needed',
         `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
         confirmText: 'Download',
         cancelText: 'Cancel',
         onConfirm: () => {
            request.get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', (error, response, body) => {
               if (error) {
                  return electron.shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
               }
               fs.writeFileSync(path.join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body);
            });
         }
      });
   }

   start() { }

   stop() { }
} : (([Plugin, API]) => {
   const { Patcher, WebpackModules } = API;
   const Typing = WebpackModules.getByProps('startTyping');

   return class SilentTyping extends Plugin {
      constructor() {
         super();
      }

      start() {
         Patcher.instead(Typing, 'startTyping', () => { });
         Patcher.instead(Typing, 'stopTyping', () => { });
      }

      stop() {
         Patcher.unpatchAll();
      }
   };
})(global.ZeresPluginLibrary.buildPlugin(config));