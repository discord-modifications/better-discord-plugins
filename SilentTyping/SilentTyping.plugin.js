/**
 * @name SilentTyping
 * @source https://github.com/slow/better-discord-plugins/blob/master/SilentTyping/SilentTyping.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/SilentTyping/SilentTyping.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/SilentTyping/SilentTyping.plugin.js
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

class SilentTyping {
   constructor() {
      Object.assign(this, ...Object.entries({
         getName: 'SilentTyping',
         getDescription: 'Silences your typing indicator/status.',
         getVersion: '1.0.0',
         getAuthor: 'eternal'
      }).map(([f, v]) => ({ [f]: () => v })));
   }

   start() {
      let typing = BdApi.findModuleByProps('startTyping');
      typing.startTyping = (() => () => { })(this.oldStartTyping = typing.startTyping);
      typing.stopTyping = (() => () => { })(this.oldStopTyping = typing.stopTyping);
   }

   stop() {
      let typing = BdApi.findModuleByProps('startTyping');
      typing.startTyping = this.oldStartTyping;
      typing.stopTyping = this.oldStopTyping;
   }
}
