import { PageSchema } from "./types";
import { STARTER_SCHEMA } from "./seed";

const STORAGE_KEY = "calendair.builder.schemas";
const LAST_OPENED_KEY = "calendair.builder.lastOpened";

export const Persistence = {
    saveSchemas: (schemas: PageSchema[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
    },

    loadSchemas: (): PageSchema[] => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            const initial = [STARTER_SCHEMA];
            Persistence.saveSchemas(initial);
            return initial;
        }
        return JSON.parse(stored);
    },

    saveLastOpened: (id: string) => {
        localStorage.setItem(LAST_OPENED_KEY, id);
    },

    loadLastOpened: (): string | null => {
        return localStorage.getItem(LAST_OPENED_KEY);
    },

    exportSchema: (schema: PageSchema) => {
        const data = JSON.stringify(schema, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${schema.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importSchema: async (file: File): Promise<PageSchema> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const schema = JSON.parse(e.target?.result as string);
                    resolve(schema);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }
};
