enum NamingEnum {
   onLogIn = 'BettingOnLogIn',
   onRegister = 'BettingOnRegister',
   onSessionRefresh = 'BettingOnSessionRefresh',
   onRecharge = 'BettingOnRecharge',
   onRouteChange = 'BettingOnRouteChange',
}

export class BettingContent {
   private debug: boolean;

   public styles: string;
   public scriptSrc: string;
   public initializeParams: object;

   public target = 'bettech';

   private BTRenderer: any;
   private styleElement: HTMLStyleElement;
   private scriptElement: HTMLScriptElement;

   constructor(
      base64: string,
      config?: {
         target?: string;
         debug?: boolean;
         onLogin?: () => void;
         onRegister?: () => void;
         onSessionRefresh?: () => void;
         onRecharge?: () => void;
         onRouteChange?: (...params: any) => void;
      },
   ) {
      this.debug = config?.debug ?? false;
      let htmlContent = atob(base64);

      if (config?.target) {
         this.target = config.target;
      }

      htmlContent = htmlContent.replace(/(target:\s*).*?(,|\s*})/, `$1${this.target}$2`);

      const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
      this.styles = styleMatch ? styleMatch[1] : '';

      const scriptSrcMatch = htmlContent.match(/<script src="([^"]+)"><\/script>/);
      this.scriptSrc = scriptSrcMatch ? scriptSrcMatch[1] : '';

      if (config?.onLogin !== undefined) {
         this.setWindow(NamingEnum.onLogIn, config.onLogin);
         htmlContent = htmlContent.replace(
            /\/\*!-template-on-login--\*\/[\s\S]*?\/\*--template-on-login-!\*\//g,
            `console.log(window); window.${NamingEnum.onLogIn}();`,
         );
      }

      if (config?.onRegister !== undefined) {
         this.setWindow(NamingEnum.onRegister, config.onRegister);
         htmlContent = htmlContent.replace(
            /\/\*!-template-on-register--\*\/[\s\S]*?\/\*--template-on-register-!\*\//g,
            `window.${NamingEnum.onRegister}();`,
         );
      }

      if (config?.onSessionRefresh !== undefined) {
         this.setWindow(NamingEnum.onSessionRefresh, config.onSessionRefresh);
         htmlContent = htmlContent.replace(
            /\/\*!template-on-session-refresh--\*\/[\s\S]*?\/\*--template-on-session-refresh-!\*\//g,
            `window.betting.${NamingEnum.onSessionRefresh}();`,
         );
      }

      if (config?.onRecharge !== undefined) {
         this.setWindow(NamingEnum.onRecharge, config.onRecharge);
         htmlContent = htmlContent.replace(
            /\/\*!-template-on-recharge--\*\/[\s\S]*?\/\*--template-on-recharge-!\*\//g,
            `window.${NamingEnum.onRecharge}();`,
         );
      }

      if (config?.onRouteChange !== undefined) {
         this.setWindow(NamingEnum.onRouteChange, config.onRouteChange);
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
   }

   public inject = () => {
      this.styleElement = document.createElement('style');
      this.styleElement.textContent = this.styles;
      document.head.appendChild(this.styleElement);

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
      if (this.styleElement && document.head.contains(this.styleElement)) {
         document.head.removeChild(this.styleElement);
      }

      setTimeout(() => {
         if (this.scriptElement && document.body.contains(this.scriptElement)) {
            document.body.removeChild(this.scriptElement);
         }
      }, 0);

      const div = document.getElementById(this.target);
      if (div) {
         div.innerHTML = '';
      }

      if (this.BTRenderer && typeof this.BTRenderer.kill === 'function') {
         try {
            this.BTRenderer.kill();
         } catch {}
      }

      if (this.styleElement) {
         while (this.styleElement.nextSibling) {
            document.head.removeChild(this.styleElement.nextSibling);
         }
      }

      Object.values(NamingEnum).forEach((name) => {
         if (window[name]) {
            delete window[name];
         }
         this.debug && console.log('Deleted window object:', name);
      });
   };

   private setWindow(type: NamingEnum, value: any) {
      this.debug && console.log('Created window object:', type, value);
      (window as any)[type] = value;
   }
}
