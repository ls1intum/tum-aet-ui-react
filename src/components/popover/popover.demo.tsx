import { Button } from '../button';
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverPopup,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
} from './popover';

export default function PopoverDemo() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 80, flexWrap: 'wrap' }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger render={<Button variant="outlined" />}>{side}</PopoverTrigger>
          <PopoverPortal>
            <PopoverPositioner side={side} sideOffset={8}>
              <PopoverPopup>
                <PopoverTitle>Details ({side})</PopoverTitle>
                <PopoverDescription>Rich content with an action.</PopoverDescription>
                <PopoverClose render={<Button size="small" />}>Done</PopoverClose>
              </PopoverPopup>
            </PopoverPositioner>
          </PopoverPortal>
        </Popover>
      ))}
    </div>
  );
}
