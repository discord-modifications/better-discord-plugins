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
         version: '1.0.6',
         description: 'Notifies you when someone removes you from their friends list, you are banned/kicked from a server or kicked from a group chat.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/RelationshipsNotifier/RelationshipsNotifier.plugin.js'
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
      const { WebpackModules, Patcher } = API;
      const ChannelStore = WebpackModules.getByProps('openPrivateChannel');
      const { getCurrentUser } = WebpackModules.getByProps('getCurrentUser');
      const { getChannels } = WebpackModules.getByProps('getChannels');
      const { getGuilds } = WebpackModules.getByProps('getGuilds');
      const Dispatcher = WebpackModules.getByProps('subscribe');
      const { getUser } = WebpackModules.getByProps('getUser');

      return class RelationshipsNotifier extends Plugin {
         constructor() {
            super();
         }

         start() {
            this.cachedGroups = [...Object.values(getChannels())].filter((c) => c.type === 3);
            this.cachedGuilds = [...Object.values(getGuilds())];

            Dispatcher.subscribe('RELATIONSHIP_REMOVE', this.relationshipRemove);
            Dispatcher.subscribe('GUILD_MEMBER_REMOVE', this.memberRemove);
            Dispatcher.subscribe('GUILD_BAN_ADD', this.ban);
            Dispatcher.subscribe('GUILD_CREATE', this.guildCreate);
            Dispatcher.subscribe('CHANNEL_CREATE', this.channelCreate);
            Dispatcher.subscribe('CHANNEL_DELETE', this.channelDelete);

            this.mostRecentlyRemovedID = null;
            this.mostRecentlyLeftGuild = null;
            this.mostRecentlyLeftGroup = null;

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
         };

         stop() {
            Patcher.unpatchAll();
            Dispatcher.unsubscribe('RELATIONSHIP_REMOVE', this.relationshipRemove);
            Dispatcher.unsubscribe('GUILD_MEMBER_REMOVE', this.memberRemove);
            Dispatcher.unsubscribe('GUILD_BAN_ADD', this.ban);
            Dispatcher.unsubscribe('GUILD_CREATE', this.guildCreate);
            Dispatcher.unsubscribe('CHANNEL_CREATE', this.channelCreate);
            Dispatcher.unsubscribe('CHANNEL_DELETE', this.channelDelete);
         };

         guildCreate = (data) => {
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
            this.fireToast('group', channel);
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

         ban = (data) => {
            if (data.user.id !== getCurrentUser().id) return;
            let guild = this.cachedGuilds.find((g) => g.id == data.guildId);
            if (!guild || guild === null) return;
            this.removeGuildFromCache(guild.id);
            this.fireToast('ban', guild);

         };

         relationshipRemove = (data) => {
            if (data.relationship.type === 3 || data.relationship.type === 4) return;
            if (this.mostRecentlyRemovedID === data.relationship.id) {
               this.mostRecentlyRemovedID = null;
               return;
            }
            let user = getUser(data.relationship.id);
            if (!user || user === null) return;
            this.fireToast('remove', user);
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
            this.fireToast('kick', guild);

            this.mostRecentlyLeftGuild = null;
         };

         fireToast(type, instance) {
            let message = "Relationships Notifier - Couldn't determine type.";
            let options = { timeout: 0 };
            switch (type) {
               case 'remove':
                  message = `<@${instance.id}> has removed you as a friend`;
                  options.onClick = () => ChannelStore.openPrivateChannel(instance.id);
                  break;
               case 'kick':
                  message = `You've been kicked from ${instance.name}`;
                  break;
               case 'ban':
                  message = `You've been banned from ${instance.name}`;
                  break;
               case 'group':
                  message = "You've been removed from the group chat ";
                  if (instance.name.length === 0) {
                     message += instance.recipients.map(u => `<@${u}>`).join(', ');
                  } else {
                     message += instance.name;
                  }
                  break;
            }
            XenoLib.Notifications.warning(message, options);
         }
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
