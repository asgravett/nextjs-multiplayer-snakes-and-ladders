import { render, screen, fireEvent } from '@testing-library/react';
import DiceRoller from '@/components/DiceRoller';

describe('DiceRoller', () => {
  test('should render the Roll Dice button', () => {
    render(<DiceRoller onRoll={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /roll dice/i }),
    ).toBeInTheDocument();
  });

  test('should call onRoll when the button is clicked', () => {
    const mockOnRoll = jest.fn();
    render(<DiceRoller onRoll={mockOnRoll} />);

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(mockOnRoll).toHaveBeenCalledTimes(1);
  });

  test('should be enabled by default when disabled prop is not provided', () => {
    render(<DiceRoller onRoll={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /roll dice/i }),
    ).not.toBeDisabled();
  });

  test('should be disabled when the disabled prop is true', () => {
    render(<DiceRoller onRoll={jest.fn()} disabled={true} />);
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  });

  test('should have an aria-label attribute for accessibility', () => {
    render(<DiceRoller onRoll={jest.fn()} />);
    expect(screen.getByRole('button', { name: /roll dice/i })).toHaveAttribute(
      'aria-label',
      'Roll dice',
    );
  });

  test('should apply disabled styling class when disabled', () => {
    render(<DiceRoller onRoll={jest.fn()} disabled={true} />);
    const button = screen.getByRole('button', { name: /roll dice/i });
    expect(button.className).toContain('cursor-not-allowed');
  });

  test('should apply active styling class when enabled', () => {
    render(<DiceRoller onRoll={jest.fn()} disabled={false} />);
    const button = screen.getByRole('button', { name: /roll dice/i });
    expect(button.className).toContain('bg-blue-600');
  });
});
