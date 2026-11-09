import { Button } from './button';
import { ButtonGroup } from './button-group';
import { CheckIcon } from '../../internal/icons';

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'] as const;
const variants = ['solid', 'outlined', 'text'] as const;

export default function ButtonDemo() {
  return (
    <>
      {variants.map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {severities.map((severity) => (
            <Button key={severity} severity={severity} variant={variant}>
              {severity}
            </Button>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Button size="small">Small</Button>
        <Button>Default</Button>
        <Button size="large">Large</Button>
        <Button icon={<CheckIcon />}>With icon</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button rounded aria-label="Done" icon={<CheckIcon />} />
      </div>
      <ButtonGroup>
        <Button variant="outlined">One</Button>
        <Button variant="outlined">Two</Button>
        <Button variant="outlined">Three</Button>
      </ButtonGroup>
    </>
  );
}
