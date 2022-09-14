/**
 * @name ShowHiddenChannels
 * @source https://github.com/discord-modifications/better-discord-plugins/blob/master/ShowHiddenChannels/ShowHiddenChannels.plugin.js
 * @updateUrl https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/ShowHiddenChannels/ShowHiddenChannels.plugin.js
 * @website https://github.com/discord-modifications/better-discord-plugins/tree/master/ShowHiddenChannels/ShowHiddenChannels.plugin.js
 * @authorId 263689920210534400
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
         name: 'ShowHiddenChannels',
         authors: [
            {
               name: 'eternal',
               discord_id: '263689920210534400',
               github_username: 'eternal404'
            }
         ],
         version: '1.0.1',
         description: 'Displays all hidden channels which can\'t be accessed, this won\'t allow you to read them.',
         github: 'https://github.com/eternal404',
         github_raw: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/ShowHiddenChannels/ShowHiddenChannels.plugin.js'
      },
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
      const { Patcher, Utilities, DiscordModules: { Clickable, DiscordConstants, MessageActions, LocaleManager }, PluginUtilities } = API;
      const { React, Webpack } = BdApi;

      const [
         Route,
         ChannelItem,
         ChannelClasses,
         ChannelUtil,
         Permissions,
         Channel,
         { getChannel } = {},
         { getGuild } = {},
         { iconItem, actionIcon } = {},
         UnreadStore,
         Voice,
         { TooltipContainer: Tooltip } = {},
         LockClosed,
         ChannelTopic,
         { chat } = {},
         Text
      ] = Webpack.getBulk(
         { filter: Webpack.Filters.byDisplayName('RouteWithImpression'), defaultExport: false },
         { filter: Webpack.Filters.byDisplayName('ChannelItem'), defaultExport: false },
         { filter: Webpack.Filters.byProps('wrapper', 'mainContent') },
         { filter: Webpack.Filters.byProps('getChannelIconComponent') },
         { filter: Webpack.Filters.byProps('getChannelPermissions') },
         { filter: Webpack.Filters.byPrototypeFields('isManaged') },
         { filter: Webpack.Filters.byProps('getDMFromUserId') },
         { filter: Webpack.Filters.byProps('getGuild') },
         { filter: Webpack.Filters.byProps('iconItem') },
         { filter: Webpack.Filters.byProps('isForumPostUnread') },
         { filter: Webpack.Filters.byProps('getVoiceStateStats') },
         { filter: Webpack.Filters.byProps('TooltipContainer') },
         { filter: Webpack.Filters.byDisplayName('LockClosed') },
         { filter: Webpack.Filters.byDisplayName('ChannelTopic') },
         { filter: Webpack.Filters.byProps('chat', 'chatContent') },
         { filter: Webpack.Filters.byDisplayName('LegacyText') },
      );

      const { ChannelTypes, Permissions: DiscordPermissions } = DiscordConstants;

      function getDateFromSnowflake(number) {
         try {
            const id = parseInt(number);
            const binary = id.toString(2).padStart(64, '0');
            const excerpt = binary.substring(0, 42);
            const decimal = parseInt(excerpt, 2);
            const unix = decimal + 1420070400000;
            return new Date(unix).toLocaleString();
         } catch (e) {
            console.error(e);
            return '(Failed to get date)';
         }
      }

      const LockedScreen = React.memo(props => {
         return React.createElement('div', {
            className: ['shc-locked-chat-content', chat].filter(Boolean).join(' ')
         }, React.createElement('div', {
            className: 'shc-locked-notice'
         }, React.createElement('img', {
            className: 'shc-notice-lock',
            src: '/assets/755d4654e19c105c3cd108610b78d01c.svg'
         }), React.createElement(Text, {
            className: 'shc-locked-channel-text',
            color: Text.Colors.HEADER_PRIMARY,
            size: Text.Sizes.SIZE_32
         }, 'This is a hidden channel.'), React.createElement(Text, {
            className: 'shc-no-access-text',
            color: Text.Colors.HEADER_SECONDARY,
            size: Text.Sizes.SIZE_16
         }, 'You cannot see the contents of this channel. ', props.channel.topic && 'However, you may see its topic.'), props.channel.topic && React.createElement(ChannelTopic, {
            key: props.channel.id,
            channel: props.channel,
            guild: props.guild
         }), props.channel.lastMessageId && React.createElement(Text, {
            color: Text.Colors.INTERACTIVE_NORMAL,
            size: Text.Sizes.SIZE_14
         }, 'Last message sent: ', getDateFromSnowflake(props.channel.lastMessageId))));
      });

      return class extends Plugin {
         start() {
            this.can = Permissions.__powercordOriginal_can ?? Permissions.can;


            PluginUtilities.addStyle(this.getName(), `
               .shc-guild-settings {
                  width: auto !important;
                  margin-bottom: 32px;
               }

               .shc-guild-item.selectableItem-1MP3MQ.selected-31soGA {
                  cursor: pointer !important;
               }

               .shc-guild-scroller {
                  max-height: 500px;
               }

               .shc-lock-icon-clickable {
                  margin-left: 0;
               }

               .shc-guild-item {
                  padding: 6px;
                  padding-left: 18px;
                  margin-top: 4px;
                  margin-bottom: 4px;
                  height: auto;
               }

               .shc-guild {
                  margin: 6px;
                  width: 32px;
                  height: 32px;
                  float: left;
                  border-radius: 360px;
               }

               .shc-guild-name {
                  color: white;
                  float: left;
                  font-family: 'Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
                  font-weight: 700;
                  margin-left: 8px;
                  font-size: 20px;
               }

               .shc-guild-name {
                  margin-top: 8px;
               }

               .shc-locked-notice {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  margin: auto;
                  text-align: center;
               }

               .shc-additional-info-text {
                  margin-top: 10px;
               }

               .shc-locked-notice > div[class^="divider"] {
                  display: none
               }

               .shc-locked-notice > div[class^="topic"] {
                  background-color: var(--background-secondary);
                  padding: 5px;
                  max-width: 50vh;
                  text-overflow: ellipsis;
                  border-radius: 5px;
                  margin: 10px auto;
               }

               .shc-notice-lock {
                  -webkit-user-drag: none;
                  max-height: 128px;
               }

               .shc-locked-channel-text {
                  margin-top: 20px;
                  font-weight: bold;
               }

               .shc-no-access-text {
                  margin-top: 10px;
               }
            `);

            const _this = this;
            Channel.prototype.isHidden = function () {
               return ![1, 3].includes(this.type) && !_this.can(DiscordPermissions.VIEW_CHANNEL, this);
            };

            Patcher.after(UnreadStore, 'hasAnyUnread', (args, res) => {
               return res && !getChannel(args[0])?.isHidden();
            });

            Patcher.after(UnreadStore, 'hasUnread', (_, args, res) => {
               return res && !getChannel(args[0])?.isHidden();
            });

            Patcher.after(UnreadStore, 'hasNotableUnread', (_, args, res) => {
               return res && !getChannel(args[0])?.isHidden();
            });

            Patcher.after(UnreadStore, 'hasRelevantUnread', (_, args, res) => {
               return res && !args[0].isHidden();
            });

            Patcher.after(Permissions, 'can', (_, args, res) => {
               if (args[0] == DiscordPermissions.VIEW_CHANNEL) return true;

               return res;
            });

            Patcher.after(UnreadStore, 'getMentionCount', (_, args, res) => {
               return getChannel(args[0])?.isHidden() ? 0 : res;
            });

            Patcher.after(Route, 'default', (_, __, res) => {
               const id = res.props?.computedMatch?.params?.channelId;
               const guild = res.props?.computedMatch?.params?.guildId;

               let channel;
               if (id && guild && (channel = getChannel(id)) && channel?.isHidden?.() && channel?.id != Voice.getChannelId()) {
                  res.props.render = () => React.createElement(LockedScreen, {
                     channel,
                     guild: getGuild(guild)
                  });
               };

               return res;
            });

            Patcher.instead(MessageActions, 'fetchMessages', (ctx, args, orig) => {
               if (getChannel(args.channelId)?.isHidden?.()) return;

               return orig.apply(ctx, args);
            });

            Patcher.after(ChannelItem, 'default', (_, args, res) => {
               const instance = args[0];

               if (instance.channel?.isHidden()) {
                  const item = res.props?.children?.props;
                  if (item?.className) item.className += ` shc-hidden-channel shc-hidden-channel-type-${instance.channel.type}`;

                  const children = Utilities.findInReactTree(res, r => r?.props?.onClick && r?.type === 'div');
                  if (children.props?.children) {
                     children.props.children = [
                        React.createElement(Tooltip, {
                           text: LocaleManager.Messages.CHANNEL_LOCKED_SHORT
                        }, React.createElement(Clickable, {
                           className: [iconItem, 'shc-lock-icon-clickable'].join(' '),
                           style: {
                              display: 'block'
                           }
                        }, React.createElement(LockClosed, {
                           className: actionIcon
                        })))
                     ];
                  }

                  if (instance.channel.type == ChannelTypes.GUILD_VOICE && !instance.connected) {
                     const wrapper = Utilities.findInReactTree(res, n => n?.props?.className?.includes(ChannelClasses.wrapper));

                     if (wrapper) {
                        wrapper.props.onMouseDown = () => { };
                        wrapper.props.onMouseUp = () => { };
                     }

                     const mainContent = Utilities.findInReactTree(res, n => n?.props?.className?.includes(ChannelClasses.mainContent));

                     if (mainContent) {
                        mainContent.props.onClick = () => { };
                        mainContent.props.href = null;
                     }
                  };
               }

               return res;
            });

            Patcher.before(ChannelUtil, 'getChannelIconComponent', (_, args) => {
               if (args[0]?.isHidden?.() && args[2]?.locked) {
                  args[2].locked = false;
               }

               return args;
            });
         };

         stop() {
            delete Channel.prototype.isHidden;
            PluginUtilities.removeStyle(this.getName());
            Patcher.unpatchAll();
         };
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
