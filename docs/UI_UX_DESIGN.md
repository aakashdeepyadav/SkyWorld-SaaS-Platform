# UI/UX Design System

## Color Palette

### Primary Colors (Blue Theme)
- **Primary 50**: `#f0f9ff` - Lightest background
- **Primary 100**: `#e0f2fe` - Light background
- **Primary 200**: `#bae6fd` - Subtle accents
- **Primary 300**: `#7dd3fc` - Hover states
- **Primary 400**: `#38bdf8` - Secondary actions
- **Primary 500**: `#0ea5e9` - **Primary brand color**
- **Primary 600**: `#0284c7` - Hover states
- **Primary 700**: `#0369a1` - Active states
- **Primary 800**: `#075985` - Dark accents
- **Primary 900**: `#0c4a6e` - Darkest

### Neutral Colors
- **Gray 50**: `#f9fafb` - Background
- **Gray 100**: `#f3f4f6` - Light borders
- **Gray 200**: `#e5e7eb` - Borders
- **Gray 300**: `#d1d5db` - Disabled states
- **Gray 400**: `#9ca3af` - Placeholder text
- **Gray 500**: `#6b7280` - Secondary text
- **Gray 600**: `#4b5563` - Body text
- **Gray 700**: `#374151` - Headings
- **Gray 800**: `#1f2937` - Dark text
- **Gray 900**: `#111827` - Darkest text

### Semantic Colors
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Info**: `#3b82f6` (Blue)

## Typography

### Font Family
- **Primary**: System fonts (San Francisco, Segoe UI, Roboto, sans-serif)
- **Monospace**: 'Courier New', monospace (for code)

### Font Sizes
- **xs**: 0.75rem (12px) - Labels, captions
- **sm**: 0.875rem (14px) - Small text
- **base**: 1rem (16px) - Body text
- **lg**: 1.125rem (18px) - Large body
- **xl**: 1.25rem (20px) - Subheadings
- **2xl**: 1.5rem (24px) - Section headings
- **3xl**: 1.875rem (30px) - Page titles
- **4xl**: 2.25rem (36px) - Hero text

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Line Heights
- **Tight**: 1.25
- **Normal**: 1.5
- **Relaxed**: 1.75

## Spacing System

Based on 4px grid:
- **0**: 0px
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **5**: 20px
- **6**: 24px
- **8**: 32px
- **10**: 40px
- **12**: 48px
- **16**: 64px
- **20**: 80px

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background: #0ea5e9;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #0284c7;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: #e5e7eb;
  color: #1f2937;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
}
```

#### Danger Button
```css
.btn-danger {
  background: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
}
```

### Input Fields

```css
.input-field {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}
```

### Cards

```css
.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-primary {
  background: #dbeafe;
  color: #1e40af;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}
```

## Layout Rules

### Container
- Max width: 1280px
- Padding: 1rem (mobile), 2rem (desktop)
- Margin: 0 auto

### Grid System
- 12-column grid
- Gutter: 1.5rem
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Sidebar
- Width: 256px (16rem)
- Fixed position
- Background: white
- Shadow: right border

### Main Content
- Margin-left: 256px (sidebar width)
- Padding: 2rem
- Responsive: full width on mobile

## Responsive Design

### Mobile First Approach
1. Design for mobile (320px+)
2. Enhance for tablet (768px+)
3. Optimize for desktop (1024px+)

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile Considerations
- Touch-friendly targets (min 44x44px)
- Simplified navigation
- Stacked layouts
- Reduced padding

## Micro-interactions

### Hover States
- Buttons: Slight color darkening
- Links: Underline on hover
- Cards: Subtle shadow increase
- Icons: Scale up slightly

### Loading States
- Skeleton screens for content
- Spinner for actions
- Progress bars for uploads

### Transitions
- Duration: 200ms (fast), 300ms (normal)
- Easing: ease-in-out
- Properties: color, background, transform, opacity

## Accessibility

### WCAG 2.1 AA Compliance

1. **Color Contrast**
   - Text: 4.5:1 minimum
   - Large text: 3:1 minimum
   - Interactive elements: 3:1 minimum

2. **Keyboard Navigation**
   - All interactive elements focusable
   - Visible focus indicators
   - Logical tab order

3. **Screen Readers**
   - Semantic HTML
   - ARIA labels where needed
   - Alt text for images

4. **Text Alternatives**
   - Icons have text labels
   - Images have alt text
   - Form fields have labels

## Design Principles

1. **Clarity**: Clear visual hierarchy
2. **Consistency**: Uniform components
3. **Efficiency**: Minimal clicks to complete tasks
4. **Feedback**: Clear system status
5. **Forgiveness**: Easy error recovery

## Component Library

### Navigation
- Sidebar navigation
- Breadcrumbs
- Pagination

### Forms
- Text inputs
- Select dropdowns
- Checkboxes
- Radio buttons
- File uploads

### Feedback
- Toast notifications
- Alert messages
- Loading spinners
- Progress bars

### Data Display
- Tables
- Cards
- Lists
- Charts (future)

## Brand Guidelines

### Logo Usage
- Primary color: #0ea5e9
- Minimum size: 120px width
- Clear space: 2x logo height

### Tone of Voice
- Professional
- Friendly
- Clear
- Helpful

### Imagery
- High quality
- Relevant to context
- Consistent style
- Optimized for web

