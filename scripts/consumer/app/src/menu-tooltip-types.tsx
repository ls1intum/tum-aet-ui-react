import { createRef } from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPortal,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuLinkItem,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipArrow,
  type MenuProps,
  type TooltipProps,
} from '@tumaet/ui-react';

type Action = { id: number };
type Hint = { text: string };

export function MenuTooltipTypes({
  menuHandle,
  tooltipHandle,
}: {
  menuHandle: NonNullable<MenuProps<Action>['handle']>;
  tooltipHandle: NonNullable<TooltipProps<Hint>['handle']>;
}) {
  const portalHost = createRef<HTMLDivElement>();
  const menuTrigger = createRef<HTMLButtonElement>();
  const menuPopup = createRef<HTMLDivElement>();
  const menuItem = createRef<HTMLButtonElement>();
  const link = createRef<HTMLAnchorElement>();
  const tooltipTrigger = createRef<HTMLButtonElement>();
  const tooltipPopup = createRef<HTMLDivElement>();
  const arrow = createRef<HTMLDivElement>();
  // @ts-expect-error The typed handle also constrains a detached trigger's payload.
  const invalidMenuPayload = <MenuTrigger handle={menuHandle} payload={{ id: 'invalid' }} />;
  // @ts-expect-error Tooltip trigger handles retain their payload type.
  const invalidTooltipPayload = <TooltipTrigger handle={tooltipHandle} payload={{ text: 123 }} />;
  // @ts-expect-error Menu no longer accepts the original trigger prop.
  const oldMenu = <Menu trigger={<button type="button" />} />;
  // @ts-expect-error Tooltip content is composed inside TooltipPopup.
  const oldTooltip = <Tooltip content="Hint" />;
  return (
    <>
      <MenuTrigger handle={menuHandle} payload={{ id: 42 }} ref={menuTrigger}>
        Action
      </MenuTrigger>
      <Menu
        handle={menuHandle}
        onOpenChange={(open, details) => {
          if (!open && details.reason === 'escape-key') {
            details.cancel();
          }
        }}
      >
        {({ payload }) => {
          const id: number | undefined = payload?.id;
          return (
            <MenuPortal container={portalHost}>
              <MenuPositioner align="start">
                <MenuPopup ref={menuPopup}>
                  <MenuItem
                    ref={menuItem}
                    nativeButton
                    render={<button type="button" />}
                    className={({ highlighted }) => (highlighted ? 'highlighted' : undefined)}
                    onClick={(event) => event.preventBaseUIHandler()}
                  >
                    {id}
                  </MenuItem>
                  <MenuLinkItem ref={link} href="/docs" closeOnClick>
                    Documentation
                  </MenuLinkItem>
                </MenuPopup>
              </MenuPositioner>
            </MenuPortal>
          );
        }}
      </Menu>
      <TooltipProvider delay={150} closeDelay={100}>
        <TooltipTrigger
          handle={tooltipHandle}
          payload={{ text: 'Hint' }}
          ref={tooltipTrigger}
          aria-describedby="consumer-hint"
        >
          Help
        </TooltipTrigger>
        <Tooltip
          handle={tooltipHandle}
          onOpenChange={(_, details) => {
            const reason: string = details.reason;
            void reason;
          }}
        >
          {({ payload }) => {
            const text: string | undefined = payload?.text;
            return (
              <TooltipPortal container={portalHost}>
                <TooltipPositioner side="top">
                  <TooltipPopup ref={tooltipPopup} id="consumer-hint" variant="list">
                    {text}
                    <TooltipArrow ref={arrow} />
                  </TooltipPopup>
                </TooltipPositioner>
              </TooltipPortal>
            );
          }}
        </Tooltip>
      </TooltipProvider>
      <div ref={portalHost} />
      {invalidMenuPayload}
      {invalidTooltipPayload}
      {oldMenu}
      {oldTooltip}
    </>
  );
}
