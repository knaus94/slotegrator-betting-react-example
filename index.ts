import { execute } from '@libs/core/common';

enum NamingEnum {
   onLogIn = 'BettingOnLogIn',
   onRegister = 'BettingOnRegister',
   onSessionRefresh = 'BettingOnSessionRefresh',
   onRecharge = 'BettingOnRecharge',
   onRouteChange = 'BettingOnRouteChange',
}

export class BettingContent {
   private debug: boolean;

   public injected = false;

   public styles: string;
   public scriptSrc: string;
   public initializeParams: object;

   public target = 'bettech';

   private BTRenderer: any;
   //  private styleElement: HTMLStyleElement;
   private initialElement: HTMLMetaElement;
   private scriptElement: HTMLScriptElement;

   constructor(
      htmlContent: string,
      options?: {
         target?: string;
         themeName?: string;
         minFrameHeight?: number;
         betSlipOffsetTop?: number;
         betslipZIndex?: number;
         lang?: string;
         debug?: boolean;
         onLogin?: () => void;
         onRegister?: () => void;
         onSessionRefresh?: () => void;
         onRecharge?: () => void;
         onRouteChange?: (...params: any) => void;
         inject?: boolean;
      },
   ) {
      this.debug = options?.debug ?? false;

      if (options?.target) {
         this.target = options.target;
      }

      if (options?.themeName) {
         htmlContent = htmlContent.replace(/(themeName:\s*).*?(,|\s*})/, `$1"${options.themeName}"$2`);
      }

      if (options?.minFrameHeight) {
         htmlContent = htmlContent.replace(/(minFrameHeight:\s*).*?(,|\s*})/, `$1${options.minFrameHeight}$2`);
      }

      if (options?.betslipZIndex) {
         htmlContent = htmlContent.replace(/(betslipZIndex:\s*).*?(,|\s*})/, `$1${options.betslipZIndex}$2`);
      }

      if (options?.betSlipOffsetTop) {
         htmlContent = htmlContent.replace(/(betSlipOffsetTop:\s*).*?(,|\s*})/, `$1${options.betSlipOffsetTop}$2`);
      }

      if (options?.lang) {
         htmlContent = htmlContent.replace(/(lang:\s*).*?(,|\s*})/, `$1"${options.lang}"$2`);
      }

      htmlContent = htmlContent.replace(/(target:\s*).*?(,|\s*})/, `$1${this.target}$2`);

      const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
      this.styles = styleMatch ? styleMatch[1] : '';

      const scriptSrcMatch = htmlContent.match(/<script src="([^"]+)"><\/script>/);
      this.scriptSrc = scriptSrcMatch ? scriptSrcMatch[1] : '';

      if (options?.onLogin !== undefined) {
         this.setWindow(NamingEnum.onLogIn, options.onLogin);
         htmlContent = htmlContent.replace(
            /\/\*!-template-on-login--\*\/[\s\S]*?\/\*--template-on-login-!\*\//g,
            `window.${NamingEnum.onLogIn}();`,
         );
      }

      if (options?.onRegister !== undefined) {
         this.setWindow(NamingEnum.onRegister, options.onRegister);
         htmlContent = htmlContent.replace(
            /\/\*!-template-on-register--\*\/[\s\S]*?\/\*--template-on-register-!\*\//g,
            `window.${NamingEnum.onRegister}();`,
         );
      }

      if (options?.onSessionRefresh !== undefined) {
         this.setWindow(NamingEnum.onSessionRefresh, options.onSessionRefresh);
         htmlContent = htmlContent.replace(
            /\/\*!template-on-session-refresh--\*\/[\s\S]*?\/\*--template-on-session-refresh-!\*\//g,
            `window.betting.${NamingEnum.onSessionRefresh}();`,
         );
      }

      if (options?.onRecharge !== undefined) {
         this.setWindow(NamingEnum.onRecharge, options.onRecharge);
         htmlContent = htmlContent.replace(
            /\/\*!-template-on-recharge--\*\/[\s\S]*?\/\*--template-on-recharge-!\*\//g,
            `window.${NamingEnum.onRecharge}();`,
         );
      }

      if (options?.onRouteChange !== undefined) {
         this.setWindow(NamingEnum.onRouteChange, options.onRouteChange);
         htmlContent = htmlContent.replace(
            /\/\*!-template-on-route-change--\*\/[\s\S]*?\/\*--template-on-route-change-!\*\//g,
            `window.${NamingEnum.onRouteChange}();`,
         );
      }

      this.initializeParams = execute(() => {
         const initStart = htmlContent.indexOf('initialize({') + 'initialize({'.length - 1;
         let balance = 1;
         let params = '';

         for (let i = initStart + 1; i < htmlContent.length; i++) {
            params += htmlContent[i];
            if (htmlContent[i] === '{') {
               balance++;
            } else if (htmlContent[i] === '}') {
               balance--;
               if (balance === 0) {
                  params = params.slice(0, -1);
                  break;
               }
            }
         }

         // eslint-disable-next-line no-eval
         return eval('({' + params + '})');
      });

      this.debug && console.log(`Initialized params: ${this.initializeParams}`);

      if (options?.inject) {
         this.inject();
      }
   }

   public inject = () => {
      if (this.injected) {
         return;
      }

      this.injected = true;

      // this.styleElement = document.createElement('style');
      // this.styleElement.textContent = this.styles;
      // document.head.appendChild(this.styleElement);

      this.initialElement = document.createElement('meta');
      this.initialElement.name = 'betting-marker';
      this.initialElement.content = 'initial';
      document.head.appendChild(this.initialElement);

      this.scriptElement = document.createElement('script');
      this.scriptElement.src = this.scriptSrc;
      this.scriptElement.async = true;
      document.body.appendChild(this.scriptElement);

      this.scriptElement.onload = () => {
         try {
            this.BTRenderer = new (window as any).BTRenderer().initialize(this.initializeParams);
         } catch {
            this.cleanup();
         }
      };
      this.scriptElement.onabort = () => {};
   };

   public cleanup = () => {
      if (!this.injected) {
         return;
      }

      if (this.BTRenderer && typeof this.BTRenderer.kill === 'function') {
         try {
            this.BTRenderer.kill();
         } catch {}
      }

      const div = document.getElementById(this.target);
      if (div) {
         div.innerHTML = '';
      }

      // if (this.styleElement) {
      //    while (this.styleElement.nextSibling) {
      //       document.head.removeChild(this.styleElement.nextSibling);
      //    }
      // }

      // if (this.styleElement && document.head.contains(this.styleElement)) {
      //    document.head.removeChild(this.styleElement);
      // }

      if (this.initialElement) {
         while (this.initialElement.nextSibling) {
            document.head.removeChild(this.initialElement.nextSibling);
         }
      }

      if (this.initialElement && document.head.contains(this.initialElement)) {
         document.head.removeChild(this.initialElement);
      }

      if (this.scriptElement && document.body.contains(this.scriptElement)) {
         document.body.removeChild(this.scriptElement);
      }

      Object.values(NamingEnum).forEach((name) => {
         if (window[name]) {
            delete window[name];
         }
         this.debug && console.log('Deleted window object:', name);
      });

      this.injected = false;
   };

   public changeLanguage = (lang: string) => {
      if (this.injected && this.BTRenderer && typeof this.BTRenderer.updateOptions === 'function') {
         this.BTRenderer.updateOptions({ lang });
      }
   };

   private setWindow(type: NamingEnum, value: any) {
      this.debug && console.log('Created window object:', type, value);
      (window as any)[type] = value;
   }
}
