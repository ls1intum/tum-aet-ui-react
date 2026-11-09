import { useState } from 'react';
import { Button } from '../button';
import { EllipsisIcon } from '../../internal/icons';
import { Menu, MenuTrigger, MenuPortal, MenuPositioner, MenuPopup, MenuItem, MenuLinkItem } from './menu';

export default function MenuDemo() {
  const [last, setLast] = useState('Nothing chosen yet');
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16 }}>
      <Menu>
        <MenuTrigger render={<Button variant="outlined" />}>Actions</MenuTrigger>
        <MenuPortal>
          <MenuPositioner align="start">
            <MenuPopup>
              <MenuItem onClick={() => setLast('Rename')}>Rename</MenuItem>
              <MenuItem onClick={() => setLast('Duplicate')}>Duplicate</MenuItem>
              <MenuLinkItem href="https://tum.de" target="_blank" rel="noreferrer" closeOnClick>
                Open TUM website
              </MenuLinkItem>
              <MenuItem disabled>Archive (disabled)</MenuItem>
              <MenuItem onClick={() => setLast('Delete')}>Delete</MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </Menu>
      <Menu>
        <MenuTrigger render={<Button variant="text" rounded icon={<EllipsisIcon />} />} aria-label="More" />
        <MenuPortal>
          <MenuPositioner align="end">
            <MenuPopup>
              <MenuItem onClick={() => setLast('One')}>One</MenuItem>
              <MenuItem onClick={() => setLast('Two')}>Two</MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </Menu>
      <span>{last}</span>
    </div>
  );
}
