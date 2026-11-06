import { Button } from '../button';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipArrow,
} from './tooltip';

export default function TooltipDemo() {
  return (
    <TooltipProvider delay={150} closeDelay={100}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 32 }}>
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger render={<Button variant="outlined" />}>{side}</TooltipTrigger>
            <TooltipPortal>
              <TooltipPositioner side={side}>
                <TooltipPopup>
                  Tooltip on the {side}
                  <TooltipArrow />
                </TooltipPopup>
              </TooltipPositioner>
            </TooltipPortal>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger render={<Button variant="outlined" />}>Validation reasons</TooltipTrigger>
          <TooltipPortal>
            <TooltipPositioner>
              <TooltipPopup variant="list">
                <ul>
                  <li>Name is required</li>
                  <li>Email must be valid</li>
                  <li>Password is too short</li>
                </ul>
                <TooltipArrow />
              </TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
