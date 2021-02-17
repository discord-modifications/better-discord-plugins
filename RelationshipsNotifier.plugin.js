//META{"name":"RelationshipsNotifier","source":"https://github.com/slow/better-discord-plugins/blob/master/RelationshipsNotifier.plugin.js","authorId":"282595588950982656","donate":"https://paypal.me/eternal404"}*//

module.exports = (() => {
   const config = {
      main: 'index.js',
      info: {
         name: 'Relationships Notifier',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow',
               twitter_username: ''
            }
         ],
         version: '1.0.0',
         description: 'Notifies you when someone removes you from their friends list, you are banned/kicked from a server or kicked from a group chat.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/RelationshipsNotifier.plugin.js'
      }
   };

   const buildPlugin = ([Plugin, API]) => {
      const { WebpackModules, Patcher } = API;
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
            switch (type) {
               case 'remove':
                  message = `${instance.username}#${instance.discriminator} has removed you as a friend`;
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
                     message += instance.recipients.map((id) => getUser(id).username).join(', ');
                  } else {
                     message += instance.name;
                  }
                  break;
            }
            XenoLib.Notifications.warning(message, { timeout: 0 });
         }
      };
   };

   let ZeresPluginLibraryOutdated = false;
   let XenoLibOutdated = false;
   try {
      const i = (i, n) => ((i = i.split('.').map(i => parseInt(i))), (n = n.split('.').map(i => parseInt(i))), !!(n[0] > i[0]) || !!(n[0] == i[0] && n[1] > i[1]) || !!(n[0] == i[0] && n[1] == i[1] && n[2] > i[2])),
         n = (n, e) => n && n._config && n._config.info && n._config.info.version && i(n._config.info.version, e),
         e = BdApi.Plugins.get('ZeresPluginLibrary'),
         o = BdApi.Plugins.get('XenoLib');
      n(e, '1.2.27') && (ZeresPluginLibraryOutdated = !0), n(o, '1.3.32') && (XenoLibOutdated = !0);
   } catch (i) {
      console.error('Error checking if libraries are out of date', i);
   }

   return !global.ZeresPluginLibrary || !global.XenoLib || ZeresPluginLibraryOutdated || XenoLibOutdated
      ? class {
         constructor() {
            this._XL_PLUGIN = true;
            this.start = this.load = this.handleMissingLib;
         }
         getName() {
            return this.name.replace(/\s+/g, '');
         }
         getAuthor() {
            return this.author;
         }
         getVersion() {
            return this.version;
         }
         getDescription() {
            return this.description + ' You are missing libraries for this plugin, please enable the plugin and click Download Now.';
         }
         start() { }
         stop() { }
         handleMissingLib() {
            const a = BdApi.findModuleByProps('openModal', 'hasModalOpen');
            if (a && a.hasModalOpen(`${this.name}_DEP_MODAL`)) return;
            const b = !global.XenoLib,
               c = !global.ZeresPluginLibrary,
               d = (b && c) || ((b || c) && (XenoLibOutdated || ZeresPluginLibraryOutdated)),
               e = (() => {
                  let a = '';
                  return b || c ? (a += `Missing${XenoLibOutdated || ZeresPluginLibraryOutdated ? ' and outdated' : ''} `) : (XenoLibOutdated || ZeresPluginLibraryOutdated) && (a += `Outdated `), (a += `${d ? 'Libraries' : 'Library'} `), a;
               })(),
               f = (() => {
                  let a = `The ${d ? 'libraries' : 'library'} `;
                  return b || XenoLibOutdated ? ((a += 'XenoLib '), (c || ZeresPluginLibraryOutdated) && (a += 'and ZeresPluginLibrary ')) : (c || ZeresPluginLibraryOutdated) && (a += 'ZeresPluginLibrary '), (a += `required for ${this.name} ${d ? 'are' : 'is'} ${b || c ? 'missing' : ''}${XenoLibOutdated || ZeresPluginLibraryOutdated ? (b || c ? ' and/or outdated' : 'outdated') : ''}.`), a;
               })(),
               g = BdApi.findModuleByDisplayName('Text'),
               h = BdApi.findModuleByDisplayName('ConfirmModal'),
               i = () => BdApi.alert(e, BdApi.React.createElement('span', {}, BdApi.React.createElement('div', {}, f), `Due to a slight mishap however, you'll have to download the libraries yourself. This is not intentional, something went wrong, errors are in console.`, c || ZeresPluginLibraryOutdated ? BdApi.React.createElement('div', {}, BdApi.React.createElement('a', { href: 'https://betterdiscord.net/ghdl?id=2252', target: '_blank' }, 'Click here to download ZeresPluginLibrary')) : null, b || XenoLibOutdated ? BdApi.React.createElement('div', {}, BdApi.React.createElement('a', { href: 'https://betterdiscord.net/ghdl?id=3169', target: '_blank' }, 'Click here to download XenoLib')) : null));
            if (!a || !h || !g) return console.error(`Missing components:${(a ? '' : ' ModalStack') + (h ? '' : ' ConfirmationModalComponent') + (g ? '' : 'TextElement')}`), i();
            class j extends BdApi.React.PureComponent {
               constructor(a) {
                  super(a), (this.state = { hasError: !1 }), (this.componentDidCatch = a => (console.error(`Error in ${this.props.label}, screenshot or copy paste the error above to Lighty for help.`), this.setState({ hasError: !0 }), 'function' == typeof this.props.onError && this.props.onError(a))), (this.render = () => (this.state.hasError ? null : this.props.children));
               }
            }
            let k = !1,
               l = !1;
            const m = a.openModal(
               b => {
                  if (l) return null;
                  try {
                     return BdApi.React.createElement(
                        j,
                        { label: 'missing dependency modal', onError: () => (a.closeModal(m), i()) },
                        BdApi.React.createElement(
                           h,
                           Object.assign(
                              {
                                 header: e,
                                 children: BdApi.React.createElement(g, { size: g.Sizes.SIZE_16, children: [`${f} Please click Download Now to download ${d ? 'them' : 'it'}.`] }),
                                 red: !1,
                                 confirmText: 'Download Now',
                                 cancelText: 'Cancel',
                                 onCancel: b.onClose,
                                 onConfirm: () => {
                                    if (k) return;
                                    k = !0;
                                    const b = require('request'),
                                       c = require('fs'),
                                       d = require('path'),
                                       e = BdApi.Plugins && BdApi.Plugins.folder ? BdApi.Plugins.folder : window.ContentManager.pluginsFolder,
                                       f = () => {
                                          (global.XenoLib && !XenoLibOutdated) ||
                                             b('https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js', (b, f, g) => {
                                                try {
                                                   if (b || 200 !== f.statusCode) return a.closeModal(m), i();
                                                   c.writeFile(d.join(e, '1XenoLib.plugin.js'), g, () => { });
                                                } catch (b) {
                                                   console.error('Fatal error downloading XenoLib', b), a.closeModal(m), i();
                                                }
                                             });
                                       };
                                    !global.ZeresPluginLibrary || ZeresPluginLibraryOutdated
                                       ? b('https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js', (b, g, h) => {
                                          try {
                                             if (b || 200 !== g.statusCode) return a.closeModal(m), i();
                                             c.writeFile(d.join(e, '0PluginLibrary.plugin.js'), h, () => { }), f();
                                          } catch (b) {
                                             console.error('Fatal error downloading ZeresPluginLibrary', b), a.closeModal(m), i();
                                          }
                                       })
                                       : f();
                                 }
                              },
                              b,
                              { onClose: () => { } }
                           )
                        )
                     );
                  } catch (b) {
                     return console.error('There has been an error constructing the modal', b), (l = !0), a.closeModal(m), i(), null;
                  }
               },
               { modalKey: `${this.name}_DEP_MODAL` }
            );
         }
         get [Symbol.toStringTag]() {
            return 'Plugin';
         }
         get name() {
            return config.info.name;
         }
         get short() {
            let string = '';
            for (let i = 0, len = config.info.name.length; i < len; i++) {
               const char = config.info.name[i];
               if (char === char.toUpperCase()) string += char;
            }
            return string;
         }
         get author() {
            return config.info.authors.map(author => author.name).join(', ');
         }
         get version() {
            return config.info.version;
         }
         get description() {
            return config.info.description;
         }
      }
      : buildPlugin(global.ZeresPluginLibrary.buildPlugin(config));
})();
