/**
 * @name DNDBypass
 * @source https://github.com/slow/better-discord-plugins/blob/master/DNDBypass/DNDBypass.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/DNDBypass/DNDBypass.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/DNDBypass/DNDBypass.plugin.js
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
   const config = {
      info: {
         name: 'DNDBypass',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow'
            }
         ],
         version: '1.0.6',
         description: 'Give your selection of friends the ability to bypass Do Not Disturb.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/DNDBypass/DNDBypass.plugin.js'
      },
      changelog: [
         {
            title: 'Fixed',
            type: 'fixed',
            items: [
               `Fixed the click-jack when trying to whitelist users.`
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
      const { WebpackModules, Patcher, PluginUtilities, DiscordModules: { React } } = API;

      const { getChannelId } = WebpackModules.getByProps('getLastSelectedChannelId');
      const Notifications = WebpackModules.getByProps('makeTextChatNotification');
      const { getChannel } = WebpackModules.getByProps('hasChannel');

      const settings = PluginUtilities.loadSettings(config.info.name, {
         friends: [],
         guilds: false,
         groups: false
      });

      const Components = (() => {
         const comps = {};

         const { AdvancedScrollerThin } = WebpackModules.getByProps('AdvancedScrollerThin');
         const PopoutList = WebpackModules.getByDisplayName('PopoutList');
         const Flex = WebpackModules.getByDisplayName('Flex');
         const { getRelationships } = WebpackModules.getByProps('getRelationships');
         const { getUser } = WebpackModules.getByProps('getUser', 'getUsers');
         const classes = {
            auditLogsFilter: WebpackModules.getByProps('guildSettingsAuditLogsUserFilterPopout').guildSettingsAuditLogsUserFilterPopout,
            elevationBorderHigh: WebpackModules.getByProps('elevationBorderHigh').elevationBorderHigh,
            alignCenter: WebpackModules.getByProps('alignCenter').alignCenter,
            scroller: WebpackModules.getByProps('listWrapper', 'scroller').scroller,
            discriminator: WebpackModules.getByProps('discriminator', 'avatar', 'scroller').discriminator,
            userText: WebpackModules.getByProps('discriminator', 'avatar', 'scroller').userText,
            popoutList: WebpackModules.getByProps('popoutList').popoutList
         };

         comps.FriendSelector = class extends React.Component {
            constructor(props) {
               super(props);

               this.state = {
                  friends: settings.friends
               };
            };

            render() {
               const PopoutListSearchBar = PopoutList.prototype.constructor.SearchBar;
               const PopoutListDivider = PopoutList.prototype.constructor.Divider;
               const FlexChild = Flex.prototype.constructor.Child;
               const SelectableItem = PopoutList.prototype.constructor.Item;
               const relationships = getRelationships();
               let friends = Object.keys(relationships).filter(relation => relationships[relation] === 1);
               friends = [...this.state.friends.filter(f => !friends.includes(f)), ...friends];
               return React.createElement('div', null, React.createElement('div', {
                  className: `db-user-settings ${classes.popoutList} ${classes.auditLogsFilter} ${classes.elevationBorderHigh}`,
                  popoutKey: 'db-users'
               }, React.createElement(PopoutListSearchBar, {
                  autoFocus: true,
                  placeholder: 'Search friends',
                  query: this.state.friendsQuery || '',
                  onChange: e => this.setState({
                     friendsQuery: e
                  }),
                  onClear: () => this.setState({
                     friendsQuery: ''
                  })
               }), React.createElement(PopoutListDivider, null), React.createElement(AdvancedScrollerThin, {
                  className: `${classes.scroller} db-friend-scroller`
               }, friends.map(getUser).filter(user => this.state.friendsQuery ? user?.username?.toLowerCase().includes(this.state.friendsQuery.toLowerCase()) : true).map((user, i) => user && React.createElement(SelectableItem, {
                  className: 'db-friend-item',
                  id: user.id,
                  key: i.toString(),
                  selected: this.state.friends.includes(user.id),
                  onClick: (e) => {
                     if (!e.selected) {
                        this.state.friends.push(e.id);
                     } else {
                        const index = this.state.friends.indexOf(e.id);
                        if (~index) this.state.friends.splice(index, 1);
                     }

                     this.props.onClick(e, this.state);
                  }
               }, React.createElement(Flex, {
                  align: classes.alignCenter,
                  basis: 'auto',
                  grow: 1,
                  shrink: 1
               }, React.createElement('div', null, React.createElement(Flex, {
                  align: classes.alignCenter,
                  basis: 'auto',
                  grow: 1,
                  shrink: 1
               }, React.createElement(FlexChild, {
                  key: 'avatar',
                  basis: 'auto',
                  grow: 0,
                  shrink: 0,
                  wrap: false
               }, React.createElement('img', {
                  src: !user.avatar ? `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png` : `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
                  width: 32,
                  height: 32,
                  style: {
                     borderRadius: '360px'
                  }
               })), React.createElement(FlexChild, {
                  key: 'user-text',
                  basis: 'auto',
                  grow: 1,
                  shrink: 1,
                  wrap: false
               }, React.createElement('div', {
                  className: classes.userText
               }, React.createElement('span', {
                  className: classes.userText
               }, user.username), React.createElement('span', {
                  className: classes.discriminator
               }, '#', user.discriminator)))))))).sort((a, b) => {
                  const firstName = a.props.children.props.children.props.children.props.children[1].props.children.props.children[0].props.children;
                  const secondName = b.props.children.props.children.props.children.props.children[1].props.children.props.children[0].props.children;
                  return firstName.localeCompare(secondName);
               }))));
            }
         };

         const SwitchItem = WebpackModules.getByDisplayName('SwitchItem');
         comps.SwitchItem = SwitchItem;

         return comps;
      })();

      return class DNDBypass extends Plugin {
         constructor() {
            super();
         }

         start() {
            Patcher.after(Notifications, 'shouldNotify', (_, [msg, channelId], res) => {
               if (settings.friends.includes(msg.author.id)) {
                  // Check if were already looking at the channel
                  if (document.hasFocus() && getChannelId() == channelId) {
                     return false;
                  }

                  // Guilds
                  if (msg.guild_id && !settings.guilds) {
                     return false;
                  }

                  // Groups
                  if (getChannel(msg.channel_id)?.type == 3 && !settings.groups) {
                     return false;
                  }

                  return true;
               }

               return res;
            });

            PluginUtilities.addStyle(config.info.name, `
               .db-user-settings {
                  width: auto !important;
                  margin-bottom: 32px;
               }

               .db-friend-item.selectableItem-1MP3MQ.selected-31soGA {
                  cursor: pointer !important;
               }

               .db-friend-scroller {
                  max-height: 500px;
               }

               .db-friend-item {
                  padding: 6px;
                  padding-left: 18px;
                  margin-top: 4px;
                  margin-bottom: 4px;
                  height: auto;
               }

               .db-friend {
                  margin: 6px;
                  width: 32px;
                  height: 32px;
                  float: left;
                  border-radius: 360px;
               }

               .db-friend-name {
                  color: white;
                  float: left;
                  font-family: 'Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
                  font-weight: 700;
                  margin-left: 8px;
                  font-size: 20px;
               }

               .db-friend-discrim {
                  color: hsla(0, 0%, 100%, .6);
                  float: left;
                  font-family: 'Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
                  font-size: 16px;
                  position: relative;
                  top: 4px;
                  padding-right: 6px;
               }

               .db-friend-discrim::before {
                  content: '#'
               }

               .db-friend-name, .db-friend-discrim {
                  margin-top: 8px;
               }
            `);
         };

         stop() {
            PluginUtilities.removeStyle(config.info.name);
            Patcher.unpatchAll();
         };

         getSettingsPanel() {
            return class Settings extends React.Component {
               constructor(props) {
                  super(props);
               }

               update(setting, value) {
                  settings[setting] = value;
                  PluginUtilities.saveSettings(config.info.name, settings);
                  this.forceUpdate();
               }

               render() {
                  return React.createElement('div', null, React.createElement(Components.SwitchItem, {
                     note: 'Bypasses DND or any type of server mute/channel mute when that person speaks in a server.',
                     value: settings.guilds,
                     onChange: () => this.update('guilds', !settings.guilds)
                  }, 'Notify if user speaks in server'), React.createElement(Components.SwitchItem, {
                     note: 'Bypasses DND or any type of channel mute when that person speaks in a group chat.',
                     value: settings.groups,
                     onChange: () => this.update('groups', !settings.groups)
                  }, 'Notify if user speaks in group chats'), React.createElement(Components.FriendSelector, {
                     onClick: (e, state) => {
                        if (!e.selected) {
                           this.update('friends', state.friends);
                        } else {
                           this.update('friends', state.friends.filter(a => a !== e.id));
                        }
                     }
                  }));
               };
            };
         };
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
