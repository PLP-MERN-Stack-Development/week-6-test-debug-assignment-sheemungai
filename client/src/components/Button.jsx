// components/Button.jsx - Reusable Button Component

import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * Reusable Button Component
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, danger)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional props to pass to button element
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...rest
}) => {
  // Build CSS classes
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    disabled ? 'btn-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  // Handle click with disabled check
  const handleClick = (event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Button;
