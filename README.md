# slotegrator-betting-react-example
React Slotegrator Betting Render Example

```typescript
type Props = {
   base64: string;
};
const BettingMarkup = ({ base64 }: Props) => {
   const { t } = useTranslation();
   const setIsSignInModalOpen = useModalsStore.use.setIsSignInModalOpen();
   const contentRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const content = new BettingContent(base64, {
         target: 'bettech1',
         debug: true,
         onLogin: () => {
            setIsSignInModalOpen(true);
         },
      });

      content.inject();

      return () => {
         content.cleanup();
      };
   }, []);

   return <div id="bettech1"></div>;
};

export default BettingMarkup;

```
