/**
 * @name PictureLink
 * @source https://github.com/discord-modifications/better-discord-plugins/blob/master/PictureLink/PictureLink.plugin.js
 * @updateUrl https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/PictureLink/PictureLink.plugin.js
 * @website https://github.com/discord-modifications/better-discord-plugins/tree/master/PictureLink/PictureLink.plugin.js
 * @authorId 263689920210534400
 * @invite HQ5N7Rcajc
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
   const config = {
      info: {
         name: 'PictureLink',
         authors: [
            {
               name: 'eternal',
               discord_id: '263689920210534400',
               github_username: 'eternal404'
            }
         ],
         version: '2.0.1',
         description: "Allows you to click people's profile pictures and banners in their user modal and open them in your browser.",
         github: 'https://github.com/eternal404',
         github_raw: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/PictureLink/PictureLink.plugin.js'
      },
      changelog: [
         {
            type: 'fixed',
            title: 'Fixed',
            items: [
               'Now works again.'
            ]
         }
      ]
   };

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
      const { WebpackModules, DiscordModules: { React }, Utilities, Patcher, PluginUtilities } = API;
      const { clipboard } = require('electron');

      const listeners = [];
      async function findLazy(filter) {
         const direct = WebpackModules.find(filter);
         if (direct) return direct;

         return new Promise(resolve => {
            const listener = (m) => {
               const direct = filter(m);
               if (direct) {
                  resolve(m);
                  return void remove();
               }

               if (!m.default) return;
               const defaultMatch = filter(m.default);
               if (!defaultMatch) return;

               resolve(m.default);
               remove();
            };

            const remove = WebpackModules.addListener(listener);
            listeners.push(remove);
         });
      }

      const { openContextMenu, closeContextMenu } = WebpackModules.getByProps('openContextMenu', 'closeContextMenu');
      const ContextMenu = WebpackModules.getByProps('MenuGroup', 'MenuItem');
      const SizeRegex = /(?:\?size=\d{3,4})?$/;
      const style = `.picture-link { cursor: pointer; }`;

      return class extends Plugin {
         start() {
            this.promises = { cancelled: false };
            PluginUtilities.addStyle(this.getName(), style);

            this.patchBanners();
            this.patchModalAvatar();
         };

         async patchModalAvatar() {
            const ProfileModalHeader = await findLazy(m => m.default?.displayName == 'UserProfileModalHeader');
            if (this.promises.cancelled) return;

            const classes = WebpackModules.getByProps('relationshipButtons');
            Patcher.after(ProfileModalHeader, 'default', (_, args, res) => {
               const avatar = Utilities.findInReactTree(res, m => m?.props?.className == classes?.avatar);
               const image = args[0].user?.getAvatarURL?.(false, 4096, true)?.replace('.webp', '.png');

               if (avatar && image) {
                  avatar.props.onClick = () => open(image);

                  avatar.props.onContextMenu = (e) => openContextMenu(e, () =>
                     React.createElement(ContextMenu.default, { onClose: closeContextMenu },
                        React.createElement(ContextMenu.MenuItem, {
                           label: 'Copy Avatar URL',
                           id: 'copy-avatar-url',
                           action: () => clipboard.writeText(image)
                        })
                     )
                  );
               }
            });
         }

         patchBanners() {
            const Banners = WebpackModules.findAll(m => m.default?.displayName === 'UserBanner');

            for (const Banner of Banners) {
               Patcher.after(Banner, 'default', (_, args, res) => {
                  const [options] = args;
                  if (options.bannerType !== 1) return;

                  if (options?.bannerSrc) {
                     const image = options.bannerSrc.replace(SizeRegex, '?size=4096');

                     res.props.onClick = () => {
                        open(image);
                     };

                     res.props.onContextMenu = (e) => openContextMenu(e, () =>
                        React.createElement(ContextMenu.default, { onClose: closeContextMenu },
                           React.createElement(ContextMenu.MenuItem, {
                              label: 'Copy Banner URL',
                              id: 'copy-banner-url',
                              action: () => clipboard.writeText(image)
                           })
                        )
                     );

                     res.props.className = [res.props.className, 'picture-link'].join(' ');
                  }

                  return res;
               });
            }
         }

         stop() {
            this.promises.cancelled = true;
            PluginUtilities.removeStyle(this.getName());
            Patcher.unpatchAll();
            listeners.map(l => l());
         };
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
