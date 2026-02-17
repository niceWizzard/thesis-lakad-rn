import { useColorScheme } from "nativewind";
import { useMemo } from "react";
import { darkVars, lightVars } from "../../components/ui/gluestack-ui-provider/config";

// --- Type Definitions ---

// 1. Get all keys from lightVars (e.g., "--color-primary-500")
type ThemeVars = typeof lightVars;
type ThemeVarKey = keyof ThemeVars;

// 2. Remove standard prefix "--color-"
type StripPrefix<T> = T extends `--color-${infer R}` ? R : never;

// 3. Split into Category and Shade
// Logic: "primary-500" -> Category="primary", Shade="500"
// Logic: "background-error" -> Category="background", Shade="error"
type ExtractParts<S> = S extends `${infer Category}-${infer Shade}` ? { category: Category; shade: Shade } : never;

// 4. Create a union of all parts
type ThemeParts = ExtractParts<StripPrefix<ThemeVarKey>>;

// 5. Construct the final nested object type
// We map over the extracted categories, and for each category, we map over the shades that belong to it.
type ThemeConfig = {
    [P in ThemeParts as P['category']]: {
        [S in ThemeParts as S['category'] extends P['category'] ? S['shade'] : never]: string;
    };
};

// --- Implementation ---

const parseThemeVars = (vars: Record<string, string>): ThemeConfig => {
    const theme: any = {};

    Object.entries(vars).forEach(([key, value]) => {
        // Remove --color- prefix
        const cleanKey = key.replace(/^--color-/, "");
        const parts = cleanKey.split("-");

        // We assume the first part is always the category
        const category = parts[0];
        const shade = parts.slice(1).join("-");

        if (!theme[category]) {
            theme[category] = {};
        }

        // Convert space-separated RGB "16 185 129" to "rgb(16, 185, 129)"
        theme[category][shade] = `rgb(${value.split(" ").join(", ")})`;
    });

    return theme as ThemeConfig;
};

const useThemeConfig = (): ThemeConfig => {
    const { colorScheme } = useColorScheme();

    const theme = useMemo(() => {
        const vars = colorScheme === "dark" ? darkVars : lightVars;
        return parseThemeVars(vars);
    }, [colorScheme]);

    return theme;
};

export default useThemeConfig;