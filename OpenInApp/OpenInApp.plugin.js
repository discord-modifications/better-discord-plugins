/**
 * @name OpenInApp
 * @source https://github.com/slow/better-discord-plugins/blob/master/OpenInApp/OpenInApp.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/OpenInApp/OpenInApp.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/OpenInApp/OpenInApp.plugin.js
 * @authorId 282595588950982656
 * @invite shnvz5ryAt
 * @donate https://paypal.me/eternal404
 */

/*@cc_on
@if (@_jscript)

    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
   const services = [
      {
         name: 'Steam',
         links: ['store.steampowered.com', 'steamcommunity.com', 'help.steampowered.com'],
         identifier: 'steam://openurl/'
      },
      {
         name: 'Tidal',
         links: ['listen.tidal.com', 'tidal.com'],
         identifier: 'tidal://'
      },
      {
         name: 'Spotify',
         links: ['open.spotify.com'],
         identifier: 'spotify:'
      }
   ];

   const config = {
      info: {
         name: 'OpenInApp',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow'
            }
         ],
         version: '1.0.2',
         description: 'Opens links all over the app in their respective app.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/OpenInApp/OpenInApp.plugin.js'
      },
      changelog: [
         {
            title: 'Fixed',
            type: 'fixed',
            items: ['If someone posts a link that already includes an identifier for example: steam://something, identifiers will no longer duplicate causing the links to be unusable. The plugin will now respect the identifier and make them usable.']
         }
      ],
      defaultConfig: []
   };

   for (const service of services) config.defaultConfig.push({
      name: service.name,
      id: service.name,
      type: 'switch',
      value: true
   });

   return !global.ZeresPluginLibrary ? class {
      constructor() {
         this.start = this.load = this.handleMissingLib;
      }

      getName() {
         return config.info.name.replace(/\s+/g, '');
      }

      getAuthor() {
         return config.info.authors.map(a => a.name).join(', ');
      }

      getVersion() {
         return config.info.version;
      }

      getDescription() {
         return config.info.description + ' You are missing libraries for this plugin, please enable the plugin and click Download Now.';
      }

      start() { }

      stop() { }

      async handleMissingLib() {
         const request = require('request');
         const path = require('path');
         const fs = require('fs');

         const dependencies = [
            {
               global: 'ZeresPluginLibrary',
               filename: '0PluginLibrary.plugin.js',
               external: 'https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js',
               url: 'https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js'
            }
         ];

         if (!dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) return;

         if (global.eternalModal) {
            while (global.eternalModal && dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) await new Promise(f => setTimeout(f, 1000));
            if (!dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) return BdApi.Plugins.reload(this.getName());
         };

         global.eternalModal = true;

         BdApi.showConfirmationModal(
            'Dependencies needed',
            `Dependencies needed for ${this.getName()} are missing. Please click download to install the dependecies.`,
            {
               confirmText: 'Download',
               cancelText: 'Cancel',
               onCancel: () => delete global.eternalModal,
               onConfirm: async () => {
                  for (const dependency of dependencies) {
                     if (!window.hasOwnProperty(dependency.global)) {
                        await new Promise((resolve) => {
                           request.get(dependency.url, (error, res, body) => {
                              if (error) return electron.shell.openExternal(dependency.external);
                              fs.writeFile(path.join(BdApi.Plugins.folder, dependency.filename), body, resolve);
                           });
                        });
                     }
                  }

                  delete global.eternalModal;
               }
            }
         );
      }
   } : (([Plugin, API]) => {
      const { WebpackModules, Patcher } = API;
      const Anchor = WebpackModules.find(m => m.default?.displayName == 'Anchor');
      const Copy = WebpackModules.getByProps('asyncify', 'copy');

      return class extends Plugin {
         constructor() {
            super();
         }

         start() {
            Patcher.before(Anchor, 'default', (_, args, res) => {
               let link = args[0]?.href?.toLowerCase();

               if (link) {
                  for (const service of services) {
                     if (this.settings[service.name] && service.links.some(l => ~link.indexOf(l))) {
                        if (!link.includes(service.identifier)) args[0].href = `${service.identifier}${args[0].href}`;
                     }
                  }
               }

               return args;
            });

            Patcher.before(Copy, 'copy', (_, [link], res) => {
               for (const service of services) {
                  if (this.settings[service.name] && service.links.some(l => ~link.indexOf(l))) {
                     link = link.replace(service.identifier, '');
                  }
               }

               return [link];
            });
         };

         stop() {
            Patcher.unpatchAll();
         };

         getSettingsPanel() {
            return this.buildSettingsPanel().getElement();
         }
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
