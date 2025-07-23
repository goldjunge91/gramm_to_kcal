import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

import { icons, LogIn, X } from "lucide-react";

interface IconsProps extends LucideProps {
    name: keyof typeof icons;
}

interface IconsComponent {
    ({ name, className, ...props }: IconsProps): React.JSX.Element;
    logo: ComponentType<LucideProps>;
    close: ComponentType<LucideProps>;
}

function IconsFunction({ name, className, ...props }: IconsProps) {
    const Icon = icons[name];

    return <Icon className={className} {...props} />;
}

// Create the Icons component with static properties
export const Icons = IconsFunction as IconsComponent;

// Static icon components for backward compatibility
Icons.logo = LogIn;
Icons.close = X;
