/**
 * @name VoiceChatMoveAll
 * @source https://github.com/discord-modifications/better-discord-plugins/blob/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js
 * @updateUrl https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js
 * @website https://github.com/discord-modifications/better-discord-plugins/tree/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js
 * @authorId 282595588950982656
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
         name: 'VoiceChatMoveAll',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'eternal404'
            }
         ],
         version: '2.0.7',
         description: 'A context menu utility to move everyone to a certain voice channel.',
         github: 'https://github.com/eternal404',
         github_raw: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js'
      },
      changelog: [
         {
            title: 'Fixed',
            type: 'fixed',
            items: ['The plugin now works again.']
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
      const { WebpackModules, Patcher, DCM, DiscordModules: { React } } = API;

      const sleep = (time) => new Promise((f) => setTimeout(f, time));

      const { getVoiceStatesForChannel } = WebpackModules.getByProps('getVoiceStatesForChannel');
      const DiscordPermissions = WebpackModules.getByProps('API_HOST').Permissions;
      const { getVoiceChannelId } = WebpackModules.getByProps('getVoiceChannelId');
      const { patch } = WebpackModules.find(m => typeof m == 'object' && m.patch);
      const Menu = WebpackModules.getByProps('MenuGroup', 'MenuItem');
      const Permissions = WebpackModules.getByProps('getChannelPermissions');
      const { getChannel } = WebpackModules.getByProps('hasChannel');
      const { Endpoints } = WebpackModules.getByProps('Endpoints');
      const { getGuild } = WebpackModules.getByProps('getGuild');

      return class extends Plugin {
         constructor() {
            super();
         }

         start() {
            this.promises = { cancelled: false };
            this.patchContextMenu();
         }

         async patchContextMenu() {
            const ContextMenu = await DCM.getDiscordMenu('ChannelListVoiceChannelContextMenu');
            if (this.promises.cancelled) return;

            Patcher.after(ContextMenu, 'default', (_, args, res) => {
               const channel = args[0].channel;
               if (!channel || !channel.guild_id || !this.canMoveAll(channel)) return res;
               const currentChannel = this.getVoiceChannel();
               if (!currentChannel) return res;

               const item = React.createElement(Menu.MenuItem, {
                  action: async () => {
                     for (const member of currentChannel.members) {
                        await patch({
                           url: Endpoints.GUILD_MEMBER(channel.guild_id, member),
                           body: {
                              channel_id: channel.id
                           }
                        }).catch(async (e) => {
                           await sleep(e.body.retry_after * 1000);
                           currentChannel.members.unshift(member);
                        });
                     }
                  },
                  id: 'move-all-vc',
                  label: 'Move All'
               });

               const element = React.createElement(Menu.MenuGroup, null, item);
               if (res.props.children?.props) {
                  res.props.children?.props.children.push(element);
               } else {
                  res.props.children.push(element);
               };

               return res;
            });
         }

         stop() {
            Patcher.unpatchAll();
            this.promises.cancelled = true;
         }

         getVoiceUserIds(channel) {
            if (!channel) return null;
            return Object.keys(getVoiceStatesForChannel(channel));
         }

         canMoveAll(channel) {
            let instance = this.getVoiceChannel();

            if (
               instance?.channel.id !== channel.id &&
               instance?.channel.guild_id === channel.guild_id &&
               (
                  Permissions.can(DiscordPermissions.ADMINISTRATOR, getGuild(channel.guild_id)) ||
                  (this.canJoinAndMove(channel) && (channel.userLimit == 0 || channel.userLimit - instance.count >= 0))
               )
            ) return true;

            return false;
         }

         canJoinAndMove(channel) {
            return Permissions.can(DiscordPermissions.CONNECT, channel) && Permissions.can(DiscordPermissions.MOVE_MEMBERS, channel);
         }

         getVoiceChannel() {
            let channel = getChannel(getVoiceChannelId());
            let members = this.getVoiceUserIds(channel?.id);
            if (channel && members) return { channel, members, count: members.length };
            return null;
         }
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/