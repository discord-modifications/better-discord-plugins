/**
 * @name RelationshipsNotifier
 * @source https://github.com/slow/better-discord-plugins/blob/master/RelationshipsNotifier/RelationshipsNotifier.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/RelationshipsNotifier/RelationshipsNotifier.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/RelationshipsNotifier/RelationshipsNotifier.plugin.js
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
         name: 'RelationshipsNotifier',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow'
            }
         ],
         version: '2.0.7',
         description: 'Notifies you when someone removes you from their friends list, you are banned/kicked from a server or kicked from a group chat.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/RelationshipsNotifier/RelationshipsNotifier.plugin.js'
      },
      changelog: [
         {
            title: 'Fixes',
            type: 'fixed',
            items: [
               'The plugin now works again.',
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
      const { getCurrentUser, getUser } = WebpackModules.getByProps('getCurrentUser', 'getUser');
      const Dispatcher = WebpackModules.getByProps('_currentDispatchActionType');
      const { flexChild: FlexChild } = WebpackModules.getByProps('flexChild');
      const ChannelStore = WebpackModules.getByProps('openPrivateChannel');
      const { getChannels } = WebpackModules.getByProps('getChannels');
      const { getGuilds } = WebpackModules.getByProps('getGuilds');

      const Components = (() => {
         const comps = {};

         const FormDivider = WebpackModules.getByDisplayName('FormDivider');
         comps.Divider = () => FormDivider({ style: { marginTop: '20px' } });

         const { description } = WebpackModules.getByProps('formText', 'description');
         const DFormItem = WebpackModules.getByDisplayName('FormItem');
         const FormTitle = WebpackModules.getByDisplayName('FormTitle');
         const FormText = WebpackModules.getByDisplayName('FormText');
         const margins = WebpackModules.getByProps('avatar', 'marginBottom20');
         const Flex = WebpackModules.getByDisplayName('Flex');

         comps.Flex = Flex;
         comps.FormTitle = FormTitle;
         comps.FormText = FormText;

         comps.FormItem = class FormItem extends React.PureComponent {
            render() {
               const noteClasses = [description, this.props.noteHasMargin && margins.marginTop8].filter(Boolean).join(' ');
               return React.createElement(DFormItem, {
                  title: this.props.title,
                  required: this.props.required,
                  className: `${Flex.Direction.VERTICAL} ${Flex.Justify.START} ${Flex.Align.STRETCH} ${Flex.Wrap.NO_WRAP} ${margins.marginBottom20}`
               }, this.props.children, this.props.note && React.createElement(FormText, {
                  className: noteClasses
               }, this.props.note), React.createElement(comps.Divider, null));
            };
         };

         const Input = WebpackModules.getByDisplayName('TextInput');
         comps.TextInput = class TextInput extends React.PureComponent {
            render() {
               const { children: title, note, required } = this.props;

               delete this.props.children;
               return React.createElement(comps.FormItem, {
                  title: title,
                  note: note,
                  required: required,
                  noteHasMargin: true
               }, React.createElement(Input, this.props));
            }
         };

         const classes = {
            flexClassName: `${Flex.Direction.VERTICAL} ${Flex.Justify.START} ${Flex.Align.STRETCH} ${Flex.Wrap.NO_WRAP}`,
            classMargins: WebpackModules.getByProps('marginBottom20'),
            classDescription: WebpackModules.getByProps('formText', 'description').description,
            classesLabel: WebpackModules.getByProps('labelRow')
         };

         comps.Category = class Category extends React.PureComponent {
            constructor(props) {
               super(props);
            }

            render() {
               return React.createElement(DFormItem, {
                  className: `bd-settings-item bd-category ${classes.flexClassName} ${classes.classMargins.marginBottom20}`
               }, React.createElement('div', {
                  className: 'bd-settings-item-title',
                  onClick: () => this.props.onChange(!this.props.opened)
               }, React.createElement('svg', {
                  xmlns: 'http://www.w3.org/2000/svg',
                  viewBox: '0 0 24 24',
                  className: this.props.opened ? 'opened' : ''
               }, React.createElement('path', {
                  fill: 'var(--header-primary)',
                  d: 'M9.29 15.88L13.17 12 9.29 8.12c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0l4.59 4.59c.39.39.39 1.02 0 1.41L10.7 17.3c-.39.39-1.02.39-1.41 0-.38-.39-.39-1.03 0-1.42z'
               })), React.createElement('div', null, React.createElement('div', {
                  className: classes.classesLabel.labelRow
               }, React.createElement('label', {
                  class: classes.classesLabel.title
               }, this.props.name)), React.createElement(FormText, {
                  className: classes.classDescription
               }, this.props.description))), this.props.opened ? React.createElement('div', {
                  className: 'bd-settings-item-inner'
               }, this.props.children) : React.createElement(comps.Divider));
            }
         };

         const SwitchItem = WebpackModules.getByDisplayName('SwitchItem');
         comps.SwitchItem = SwitchItem;

         return comps;
      })();

      const settings = PluginUtilities.loadSettings(config.info.name, {
         remove: true,
         group: true,
         kick: true,
         friendCancel: true,
         removeText: '%username#%usertag removed you as a friend.',
         groupText: 'You\'ve been removed from the group %groupname',
         kickText: 'You\'ve been kicked/banned from %servername',
         friendCancelText: '%username#%usertag cancelled their friend request.',
         appToasts: true,
         appToastsFocus: true,
         desktopNotif: true,
         desktopNotifFocus: false,
      });

      return class RelationshipsNotifier extends Plugin {
         constructor() {
            super();
         }

         start() {
            if (!document.head.find(`style[id="${config.info.name}"]`)) {
               PluginUtilities.addStyle(config.info.name, `
               .bd-settings-item-title {
                  display: flex;
                  cursor: pointer;
                  align-items: center;
               }

               .bd-settings-item-title svg {
                  width: 28px;
                  height: 28px;
                  transition: transform 0.3s;
                  margin-right: 15px;
               }

               .bd-settings-item-title svg.opened {
                  transform: rotate(90deg);
               }

               .bd-settings-item-title > div {
                  flex: 1;
               }

               .bd-settings-item-inner {
                  margin-top: 20px;
                  margin-right: 30px;
               }

               .bd-settings-item.bd-category .bd-settings-item-inner {
                  margin-left: 12px;
                  border-left: 1px var(--background-modifier-accent) solid;
                  padding-left: 33px;
               }
            `);
            }

            this.cachedGroups = [...Object.values(getChannels())].filter((c) => c.type === 3);
            this.cachedGuilds = [...Object.values(getGuilds())];

            Dispatcher.subscribe('RELATIONSHIP_REMOVE', this.relationshipRemove);
            Dispatcher.subscribe('GUILD_MEMBER_REMOVE', this.memberRemove);
            Dispatcher.subscribe('GUILD_CREATE', this.guildCreate);
            Dispatcher.subscribe('CHANNEL_CREATE', this.channelCreate);
            Dispatcher.subscribe('CHANNEL_DELETE', this.channelDelete);

            this.mostRecentlyRemovedID = null;
            this.mostRecentlyLeftGuild = null;
            this.mostRecentlyLeftGroup = null;
            this.mostRecentlyLurking = null;

            const Relationships = WebpackModules.getByProps('removeRelationship');
            Patcher.after(Relationships, 'removeRelationship', (_, args) => {
               this.mostRecentlyRemovedID = args[0];
            });

            const Guilds = WebpackModules.getByProps('leaveGuild');
            Patcher.after(Guilds, 'leaveGuild', (_, args) => {
               this.mostRecentlyLeftGuild = args[0];
               this.removeGuildFromCache(args[0]);
            });

            const Channels = WebpackModules.getByProps('closePrivateChannel');
            Patcher.after(Channels, 'closePrivateChannel', (_, args) => {
               this.mostRecentlyLeftGroup = args[0];
               this.removeGroupFromCache(args[0]);
            });

            const Lurk = WebpackModules.getByProps('startLurking');
            Patcher.after(Lurk, 'startLurking', (_, [guild]) => {
               this.mostRecentlyLurking = guild;
            });
         };

         stop() {
            if (document.head.find(`style[id="${config.info.name}"]`)) {
               PluginUtilities.removeStyle(config.info.name);
            }

            Patcher.unpatchAll();
            Dispatcher.unsubscribe('RELATIONSHIP_REMOVE', this.relationshipRemove);
            Dispatcher.unsubscribe('GUILD_MEMBER_REMOVE', this.memberRemove);
            Dispatcher.unsubscribe('GUILD_CREATE', this.guildCreate);
            Dispatcher.unsubscribe('CHANNEL_CREATE', this.channelCreate);
            Dispatcher.unsubscribe('CHANNEL_DELETE', this.channelDelete);
         };

         getSettingsPanel() {
            return class Settings extends React.Component {
               constructor() {
                  super();
                  this.state = {
                     notificationsExpanded: false,
                     typesExpanded: false,
                     textExpanded: false
                  };
               }

               changeSetting(setting, value) {
                  settings[setting] = value;
                  PluginUtilities.saveSettings(config.info.name, settings);
                  this.forceUpdate();
               }

               render() {
                  return React.createElement('div', null, React.createElement(Components.Category, {
                     name: 'Notifications',
                     description: 'Customize notification behaviour.',
                     opened: this.state.notificationsExpanded,
                     onChange: () => this.setState({ notificationsExpanded: !this.state.notificationsExpanded })
                  }, React.createElement(Components.SwitchItem, {
                     note: 'Display in-app toasts.',
                     value: settings.appToasts,
                     onChange: () => this.changeSetting('appToasts', !settings.appToasts)
                  }, 'In-App Toasts'), React.createElement(Components.SwitchItem, {
                     note: 'Display in-app toasts only when discord is focused.',
                     value: settings.appToastsFocus,
                     onChange: () => this.changeSetting('appToastsFocus', !settings.appToastsFocus)
                  }, 'Focus In-App Toasts'), React.createElement(Components.SwitchItem, {
                     note: 'Display desktop notifications.',
                     value: settings.desktopNotif,
                     onChange: () => this.changeSetting('desktopNotif', !settings.desktopNotif)
                  }, 'Desktop Notifications'), React.createElement(Components.SwitchItem, {
                     note: 'Display desktop notifications even when discord is focused.',
                     value: settings.desktopNotifFocus,
                     onChange: () => this.changeSetting('desktopNotifFocus', !settings.desktopNotifFocus)
                  }, 'Focus Notifications')), React.createElement(Components.Category, {
                     name: 'Events',
                     description: 'Turn off notifications for individual events.',
                     opened: this.state.typesExpanded,
                     onChange: () => this.setState({ typesExpanded: !this.state.typesExpanded })
                  }, React.createElement(Components.SwitchItem, {
                     note: 'Display notifications when someone removes you from their friends list.',
                     value: settings.remove,
                     onChange: () => this.changeSetting('remove', !settings.remove)
                  }, 'Remove'), React.createElement(Components.SwitchItem, {
                     note: 'Display notifications when you get kicked from a server.',
                     value: settings.kick,
                     onChange: () => this.changeSetting('kick', !settings.kick)
                  }, 'Kick/Ban'), React.createElement(Components.SwitchItem, {
                     note: 'Display notifications when you get kicked from a group chat.',
                     value: settings.group,
                     onChange: () => this.changeSetting('group', !settings.group)
                  }, 'Group'), React.createElement(Components.SwitchItem, {
                     note: 'Display notifications when someone cancells their friend request.',
                     value: settings.friendCancel,
                     onChange: () => this.changeSetting('friendCancel', !settings.friendCancel)
                  }, 'Cancelled Friend Request')), React.createElement(Components.Category, {
                     name: 'Text',
                     description: 'Customize the notifications the way you want.',
                     opened: this.state.textExpanded,
                     onChange: () => this.setState({ textExpanded: !this.state.textExpanded })
                  }, React.createElement(Components.Flex, {
                     style: { justifyContent: 'center' }
                  }, React.createElement('div', {
                     className: FlexChild
                  }, React.createElement(Components.FormTitle, null, 'Remove & Cancel Variables'), React.createElement(Components.FormText, {
                     style: { textAlign: 'center' }
                  }, '%username', React.createElement('br', null), '%userid', React.createElement('br', null), '%usertag')), React.createElement('div', {
                     className: FlexChild
                  }, React.createElement(Components.FormTitle, null, 'Kick & Ban Variables'), React.createElement(Components.FormText, {
                     style: { textAlign: 'center' }
                  }, '%servername', React.createElement('br', null), '%serverid')), React.createElement('div', {
                     className: FlexChild
                  }, React.createElement(Components.FormTitle, null, 'Group Variables'), React.createElement(Components.FormText, {
                     style: { textAlign: 'center' }
                  }, '%groupname', React.createElement('br', null), '%groupid'))), React.createElement('br', null), React.createElement(Components.TextInput, {
                     value: settings.removeText,
                     onChange: v => this.changeSetting('removeText', v),
                     note: 'The text the notification will have when someone removes you.'
                  }, 'Removed Text'), React.createElement(Components.TextInput, {
                     value: settings.friendCancelText,
                     onChange: v => this.changeSetting('friendCancelText', v),
                     note: 'The text the notification will have when someone cancells their friend request.'
                  }, 'Cancelled Friend Request Text'), React.createElement(Components.TextInput, {
                     value: settings.kickText,
                     onChange: v => this.changeSetting('kickText', v),
                     note: 'The text the notification will have when you get kicked/banned from a server.'
                  }, 'Kicked/Banned Text'), React.createElement(Components.TextInput, {
                     value: settings.groupText,
                     onChange: v => this.changeSetting('groupText', v),
                     note: 'The text the notification will have when you get kicked from a group chat.'
                  }, 'Group Text')));
               };
            };
         };


         guildCreate = (data) => {
            if (this.mostRecentlyLurking == data.guild.id) {
               this.mostRecentlyLurking = null;
               this.removeGroupFromCache(data.guild.id);
               return;
            }
            this.cachedGuilds.push(data.guild);
         };

         channelCreate = (data) => {
            if ((data.channel && data.channel.type !== 3) || this.cachedGroups.find((g) => g.id === data.channel.id)) return;
            this.cachedGroups.push(data.channel);
         };

         channelDelete = (data) => {
            if ((data.channel && data.channel.type !== 3) || !this.cachedGroups.find((g) => g.id === data.channel.id)) return;
            let channel = this.cachedGroups.find((g) => g.id == data.channel.id);
            if (!channel || channel === null) return;
            this.removeGroupFromCache(channel.id);
            this.notify('group', channel);
         };

         removeGroupFromCache = (id) => {
            const index = this.cachedGroups.indexOf(this.cachedGroups.find((g) => g.id == id));
            if (index == -1) return;
            this.cachedGroups.splice(index, 1);
         };

         removeGuildFromCache = (id) => {
            const index = this.cachedGuilds.indexOf(this.cachedGuilds.find((g) => g.id == id));
            if (index == -1) return;
            this.cachedGuilds.splice(index, 1);
         };

         relationshipRemove = (data) => {
            if (data.relationship.type === 4) return;
            if (this.mostRecentlyRemovedID === data.relationship.id) {
               this.mostRecentlyRemovedID = null;
               return;
            }
            let user = getUser(data.relationship.id);
            if (!user || user === null) return;
            switch (data.relationship.type) {
               case 1:
                  this.notify('remove', user);
                  break;
               case 3:
                  this.notify('friendCancel', user);
                  break;
            }
            this.mostRecentlyRemovedID = null;
         };

         memberRemove = (data) => {
            if (this.mostRecentlyLeftGuild === data.guildId) {
               this.mostRecentlyLeftGuild = null;
               return;
            }
            if (data.user.id !== getCurrentUser().id) return;
            let guild = this.cachedGuilds.find((g) => g.id == data.guildId);
            if (!guild || guild === null) return;
            this.removeGuildFromCache(guild.id);
            this.notify('kick', guild);

            this.mostRecentlyLeftGuild = null;
         };

         notify(type, instance) {
            if (!settings[type]) return;

            const text = this.replaceWithVars(type, settings[`${type}Text`], instance);
            let options = { timeout: 0 };

            if (['friendCancel', 'remove'].includes(type)) {
               options.onClick = () => ChannelStore.openPrivateChannel(instance.id);
            }

            if (settings.appToasts) {
               if (settings.appToastsFocus && document.hasFocus() || !settings.appToastsFocus && !document.hasFocus()) {
                  XenoLib.Notifications.warning(text, options);
               }
            }


            if (settings.desktopNotif) {
               if (!document.hasFocus() || settings.desktopNotifFocus) {
                  let notification = new Notification('Relationships Notifier', {
                     body: text,
                     icon: (instance.members || instance.recipients) ? (instance.icon && `https://cdn.discordapp.com/${instance.type == 3 ?
                        'channel-icons' :
                        'icons'
                        }/${instance.id}/${instance.icon}.${instance.icon.startsWith('a_') ?
                           'gif' :
                           'png'
                        }?size=4096`
                     ) : instance.getAvatarURL?.()
                  });

                  if (['friendCancel', 'remove'].includes(type)) notification.onclick = () => {
                     ChannelStore.openPrivateChannel(instance.id);
                  };
               };
            }
         }

         replaceWithVars(type, text, object) {
            if (type === 'remove' || type === 'friendCancel') {
               return text.replace('%username#%usertag', `<@${object.id}>`).replace('%username', object.username).replace('%usertag', object.discriminator).replace('%userid', object.id);
            } else if (type === 'kick') {
               return text.replace('%servername', object.name).replace('%serverid', object.id);
            } else if (type === 'group') {
               let name = object.name.length === 0 ? object.recipients.map((id) => getUser(id).username).join(', ') : object.name;
               return text.replace('%groupname', name).replace('%groupid', object.id);
            } else {
               let name = object.name.length === 0 ? object.recipients.map((id) => getUser(id).username).join(', ') : object.name;
               return text.replace('%name', name);
            }
         }
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
