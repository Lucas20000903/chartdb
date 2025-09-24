import type { SupabaseClient } from '@supabase/supabase-js';

import type { StorageContext } from '@/context/storage-context/storage-context';
import type { Diagram } from '@/lib/domain/diagram';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import type { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';

const TABLE_DIAGRAMS = 'diagrams';
const TABLE_DB_TABLES = 'db_tables';
const TABLE_DB_RELATIONSHIPS = 'db_relationships';
const TABLE_DB_DEPENDENCIES = 'db_dependencies';
const TABLE_AREAS = 'areas';
const TABLE_DB_CUSTOM_TYPES = 'db_custom_types';
const TABLE_USER_CONFIGS = 'user_configs';
const TABLE_DIAGRAM_FILTERS = 'diagram_filters';

interface DiagramRow {
    id: string;
    user_id: string;
    name: string;
    database_type: DatabaseType;
    database_edition: DatabaseEdition | null;
    created_at: string;
    updated_at: string;
}

interface DiagramContentRow<T = unknown> {
    id: string;
    user_id: string;
    diagram_id: string;
    payload: T;
    created_at: string;
}

const toDiagram = (row: DiagramRow): Diagram => ({
    id: row.id,
    name: row.name,
    databaseType: row.database_type,
    databaseEdition: row.database_edition ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
});

const currentIso = () => new Date().toISOString();

const mapTables = (rows: DiagramContentRow[]): DBTable[] =>
    rows.map((row) => row.payload as DBTable);

const mapRelationships = (rows: DiagramContentRow[]): DBRelationship[] =>
    rows.map((row) => row.payload as DBRelationship);

const mapDependencies = (rows: DiagramContentRow[]): DBDependency[] =>
    rows.map((row) => row.payload as DBDependency);

const mapAreas = (rows: DiagramContentRow[]): Area[] =>
    rows.map((row) => row.payload as Area);

const mapCustomTypes = (rows: DiagramContentRow[]): DBCustomType[] =>
    rows.map((row) => row.payload as DBCustomType);

const handle = async <T>(
    promise: Promise<{ data: T; error: { message: string } | null }>,
    action: string
): Promise<T> => {
    const { data, error } = await promise;
    if (error) {
        if (import.meta.env.DEV) {
            console.error(`[SupabaseStorage] ${action}`, error);
        }
        throw new Error(error.message);
    }
    return data;
};

export const createSupabaseStorage = (
    client: SupabaseClient,
    userId: string
): StorageContext => {
    const selectFrom = (table: string) =>
        client.from(table).select('*').eq('user_id', userId);

    const fetchDiagramContent = async <Payload = unknown>(
        table: string,
        diagramId: string
    ): Promise<DiagramContentRow<Payload>[]> => {
        const result = await selectFrom(table).eq('diagram_id', diagramId);
        return handle(result, `fetch ${table} for diagram ${diagramId}`);
    };

    const insertContent = async <Payload = unknown>(
        table: string,
        diagramId: string,
        id: string,
        payload: Payload
    ) => {
        await handle(
            client.from(table).insert({
                id,
                diagram_id: diagramId,
                user_id: userId,
                payload,
            }),
            `insert into ${table}`
        );
    };

    const upsertContent = async <Payload = unknown>(
        table: string,
        diagramId: string,
        id: string,
        payload: Payload
    ) => {
        await handle(
            client.from(table).upsert(
                [
                    {
                        id,
                        diagram_id: diagramId,
                        user_id: userId,
                        payload,
                    },
                ],
                { onConflict: 'id' }
            ),
            `upsert into ${table}`
        );
    };

    const updateContent = async <Payload = unknown>(
        table: string,
        id: string,
        payload: Payload
    ) => {
        await handle(
            client
                .from(table)
                .update({ payload })
                .eq('user_id', userId)
                .eq('id', id),
            `update ${table} ${id}`
        );
    };

    const deleteContent = async (
        table: string,
        filters: Record<string, string>
    ) => {
        let query = client.from(table).delete().eq('user_id', userId);
        for (const [column, value] of Object.entries(filters)) {
            query = query.eq(column, value);
        }

        await handle(query, `delete from ${table}`);
    };

    const getContentRow = async <Payload = unknown>(
        table: string,
        diagramId: string,
        id: string
    ): Promise<DiagramContentRow<Payload> | null> => {
        const result = await selectFrom(table)
            .eq('diagram_id', diagramId)
            .eq('id', id)
            .maybeSingle();
        return handle(result, `get ${table} ${id}`);
    };

    const getConfig: StorageContext['getConfig'] = async () => {
        const result = await selectFrom(TABLE_USER_CONFIGS).maybeSingle();
        const row = await handle(result, 'get config');
        return row ? (row.settings as ChartDBConfig) : undefined;
    };

    const updateConfig: StorageContext['updateConfig'] = async (config) => {
        const existing = await getConfig();
        const merged: ChartDBConfig = {
            ...(existing ?? { defaultDiagramId: '' }),
            ...config,
        };

        await handle(
            client.from(TABLE_USER_CONFIGS).upsert(
                [
                    {
                        user_id: userId,
                        settings: merged,
                        updated_at: currentIso(),
                    },
                ],
                { onConflict: 'user_id' }
            ),
            'upsert config'
        );
    };

    const getDiagramFilter: StorageContext['getDiagramFilter'] = async (
        diagramId
    ) => {
        const result = await selectFrom(TABLE_DIAGRAM_FILTERS)
            .eq('diagram_id', diagramId)
            .maybeSingle();
        const row = await handle(result, 'get diagram filter');
        return row ? (row.filter as DiagramFilter) : undefined;
    };

    const updateDiagramFilter: StorageContext['updateDiagramFilter'] = async (
        diagramId,
        filter
    ) => {
        await handle(
            client.from(TABLE_DIAGRAM_FILTERS).upsert(
                [
                    {
                        diagram_id: diagramId,
                        user_id: userId,
                        filter,
                        updated_at: currentIso(),
                    },
                ],
                { onConflict: 'diagram_id,user_id' }
            ),
            'upsert diagram filter'
        );
    };

    const deleteDiagramFilter: StorageContext['deleteDiagramFilter'] = async (
        diagramId
    ) => {
        await deleteContent(TABLE_DIAGRAM_FILTERS, { diagram_id: diagramId });
    };

    const listTables = async (diagramId: string): Promise<DBTable[]> => {
        const rows = await fetchDiagramContent<DBTable>(
            TABLE_DB_TABLES,
            diagramId
        );
        return mapTables(rows);
    };

    const listRelationships = async (
        diagramId: string
    ): Promise<DBRelationship[]> => {
        const rows = await fetchDiagramContent<DBRelationship>(
            TABLE_DB_RELATIONSHIPS,
            diagramId
        );
        return mapRelationships(rows);
    };

    const listDependencies = async (
        diagramId: string
    ): Promise<DBDependency[]> => {
        const rows = await fetchDiagramContent<DBDependency>(
            TABLE_DB_DEPENDENCIES,
            diagramId
        );
        return mapDependencies(rows);
    };

    const listAreas = async (diagramId: string): Promise<Area[]> => {
        const rows = await fetchDiagramContent<Area>(TABLE_AREAS, diagramId);
        return mapAreas(rows);
    };

    const listCustomTypes = async (
        diagramId: string
    ): Promise<DBCustomType[]> => {
        const rows = await fetchDiagramContent<DBCustomType>(
            TABLE_DB_CUSTOM_TYPES,
            diagramId
        );
        return mapCustomTypes(rows);
    };

    const addDiagram: StorageContext['addDiagram'] = async ({ diagram }) => {
        const now = currentIso();
        await handle(
            client.from(TABLE_DIAGRAMS).insert({
                id: diagram.id,
                user_id: userId,
                name: diagram.name,
                database_type: diagram.databaseType,
                database_edition: diagram.databaseEdition ?? null,
                created_at: diagram.createdAt.toISOString(),
                updated_at: diagram.updatedAt.toISOString(),
            }),
            'insert diagram'
        );

        const tables = diagram.tables ?? [];
        if (tables.length > 0) {
            await Promise.all(
                tables.map((table) =>
                    insertContent(TABLE_DB_TABLES, diagram.id, table.id, table)
                )
            );
        }

        const relationships = diagram.relationships ?? [];
        if (relationships.length > 0) {
            await Promise.all(
                relationships.map((relationship) =>
                    insertContent(
                        TABLE_DB_RELATIONSHIPS,
                        diagram.id,
                        relationship.id,
                        relationship
                    )
                )
            );
        }

        const dependencies = diagram.dependencies ?? [];
        if (dependencies.length > 0) {
            await Promise.all(
                dependencies.map((dependency) =>
                    insertContent(
                        TABLE_DB_DEPENDENCIES,
                        diagram.id,
                        dependency.id,
                        dependency
                    )
                )
            );
        }

        const areas = diagram.areas ?? [];
        if (areas.length > 0) {
            await Promise.all(
                areas.map((area) =>
                    insertContent(TABLE_AREAS, diagram.id, area.id, area)
                )
            );
        }

        const customTypes = diagram.customTypes ?? [];
        if (customTypes.length > 0) {
            await Promise.all(
                customTypes.map((customType) =>
                    insertContent(
                        TABLE_DB_CUSTOM_TYPES,
                        diagram.id,
                        customType.id,
                        customType
                    )
                )
            );
        }

        await handle(
            client
                .from(TABLE_DIAGRAMS)
                .update({ updated_at: now })
                .eq('user_id', userId)
                .eq('id', diagram.id),
            'mark diagram inserted'
        );
    };

    const listDiagrams: StorageContext['listDiagrams'] = async (
        options = {
            includeRelationships: false,
            includeTables: false,
            includeDependencies: false,
            includeAreas: false,
            includeCustomTypes: false,
        }
    ) => {
        const rows = await handle(
            client
                .from(TABLE_DIAGRAMS)
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false }),
            'list diagrams'
        );

        const diagrams = rows.map(toDiagram);

        if (!rows.length) {
            return diagrams;
        }

        const needsTables = options.includeTables;
        const needsRelationships = options.includeRelationships;
        const needsDependencies = options.includeDependencies;
        const needsAreas = options.includeAreas;
        const needsCustomTypes = options.includeCustomTypes;

        if (
            !needsTables &&
            !needsRelationships &&
            !needsDependencies &&
            !needsAreas &&
            !needsCustomTypes
        ) {
            return diagrams;
        }

        await Promise.all(
            diagrams.map(async (diagram) => {
                if (needsTables) {
                    diagram.tables = await listTables(diagram.id);
                }
                if (needsRelationships) {
                    diagram.relationships = await listRelationships(diagram.id);
                }
                if (needsDependencies) {
                    diagram.dependencies = await listDependencies(diagram.id);
                }
                if (needsAreas) {
                    diagram.areas = await listAreas(diagram.id);
                }
                if (needsCustomTypes) {
                    diagram.customTypes = await listCustomTypes(diagram.id);
                }
            })
        );

        return diagrams;
    };

    const getDiagram: StorageContext['getDiagram'] = async (
        id,
        options = {
            includeRelationships: false,
            includeTables: false,
            includeDependencies: false,
            includeAreas: false,
            includeCustomTypes: false,
        }
    ) => {
        const result = await client
            .from(TABLE_DIAGRAMS)
            .select('*')
            .eq('user_id', userId)
            .eq('id', id)
            .maybeSingle();
        const row = await handle(result, 'get diagram');

        if (!row) {
            return undefined;
        }

        const diagram = toDiagram(row);

        if (options.includeTables) {
            diagram.tables = await listTables(id);
        }
        if (options.includeRelationships) {
            diagram.relationships = await listRelationships(id);
        }
        if (options.includeDependencies) {
            diagram.dependencies = await listDependencies(id);
        }
        if (options.includeAreas) {
            diagram.areas = await listAreas(id);
        }
        if (options.includeCustomTypes) {
            diagram.customTypes = await listCustomTypes(id);
        }

        return diagram;
    };

    const updateDiagram: StorageContext['updateDiagram'] = async ({
        id,
        attributes,
    }) => {
        const payload: Partial<DiagramRow> = {};

        if (attributes.name !== undefined) {
            payload.name = attributes.name;
        }
        if (attributes.databaseType !== undefined) {
            payload.database_type = attributes.databaseType;
        }
        if ('databaseEdition' in attributes) {
            payload.database_edition = attributes.databaseEdition ?? null;
        }
        if (attributes.updatedAt) {
            payload.updated_at = attributes.updatedAt.toISOString();
        }

        if (Object.keys(payload).length > 0) {
            await handle(
                client
                    .from(TABLE_DIAGRAMS)
                    .update(payload)
                    .eq('user_id', userId)
                    .eq('id', id),
                'update diagram attributes'
            );
        }

        if (attributes.id && attributes.id !== id) {
            const newId = attributes.id;

            await handle(
                client
                    .from(TABLE_DIAGRAMS)
                    .update({ id: newId })
                    .eq('user_id', userId)
                    .eq('id', id),
                'update diagram id'
            );

            await Promise.all(
                [
                    TABLE_DB_TABLES,
                    TABLE_DB_RELATIONSHIPS,
                    TABLE_DB_DEPENDENCIES,
                    TABLE_AREAS,
                    TABLE_DB_CUSTOM_TYPES,
                    TABLE_DIAGRAM_FILTERS,
                ].map((table) =>
                    handle(
                        client
                            .from(table)
                            .update({ diagram_id: newId })
                            .eq('user_id', userId)
                            .eq('diagram_id', id),
                        `update ${table} diagram ids`
                    )
                )
            );
        }
    };

    const deleteDiagram: StorageContext['deleteDiagram'] = async (id) => {
        await Promise.all([
            deleteContent(TABLE_DB_TABLES, { diagram_id: id }),
            deleteContent(TABLE_DB_RELATIONSHIPS, { diagram_id: id }),
            deleteContent(TABLE_DB_DEPENDENCIES, { diagram_id: id }),
            deleteContent(TABLE_AREAS, { diagram_id: id }),
            deleteContent(TABLE_DB_CUSTOM_TYPES, { diagram_id: id }),
            deleteContent(TABLE_DIAGRAM_FILTERS, { diagram_id: id }),
        ]);

        await deleteContent(TABLE_DIAGRAMS, { id });
    };

    const addTable: StorageContext['addTable'] = async ({
        diagramId,
        table,
    }) => {
        await insertContent(TABLE_DB_TABLES, diagramId, table.id, table);
    };

    const getTable: StorageContext['getTable'] = async ({ diagramId, id }) => {
        const row = await getContentRow<DBTable>(
            TABLE_DB_TABLES,
            diagramId,
            id
        );
        return row ? (row.payload as DBTable) : undefined;
    };

    const updateTable: StorageContext['updateTable'] = async ({
        id,
        attributes,
    }) => {
        const result = await client
            .from(TABLE_DB_TABLES)
            .select('*')
            .eq('user_id', userId)
            .eq('id', id)
            .maybeSingle();
        const row = await handle(result, 'load table for update');

        if (!row) return;

        const updated = {
            ...(row.payload as DBTable),
            ...attributes,
        } as DBTable;

        await updateContent(TABLE_DB_TABLES, id, updated);
    };

    const putTable: StorageContext['putTable'] = async ({
        diagramId,
        table,
    }) => {
        await upsertContent(TABLE_DB_TABLES, diagramId, table.id, table);
    };

    const deleteTable: StorageContext['deleteTable'] = async ({
        diagramId,
        id,
    }) => {
        await deleteContent(TABLE_DB_TABLES, { diagram_id: diagramId, id });
    };

    const deleteDiagramTables: StorageContext['deleteDiagramTables'] = async (
        diagramId
    ) => {
        await deleteContent(TABLE_DB_TABLES, { diagram_id: diagramId });
    };

    const addRelationship: StorageContext['addRelationship'] = async ({
        diagramId,
        relationship,
    }) => {
        await insertContent(
            TABLE_DB_RELATIONSHIPS,
            diagramId,
            relationship.id,
            relationship
        );
    };

    const getRelationship: StorageContext['getRelationship'] = async ({
        diagramId,
        id,
    }) => {
        const row = await getContentRow<DBRelationship>(
            TABLE_DB_RELATIONSHIPS,
            diagramId,
            id
        );
        return row ? (row.payload as DBRelationship) : undefined;
    };

    const updateRelationship: StorageContext['updateRelationship'] = async ({
        id,
        attributes,
    }) => {
        const result = await client
            .from(TABLE_DB_RELATIONSHIPS)
            .select('*')
            .eq('user_id', userId)
            .eq('id', id)
            .maybeSingle();
        const row = await handle(result, 'load relationship for update');

        if (!row) return;

        const updated = {
            ...(row.payload as DBRelationship),
            ...attributes,
        } as DBRelationship;

        await updateContent(TABLE_DB_RELATIONSHIPS, id, updated);
    };

    const deleteRelationship: StorageContext['deleteRelationship'] = async ({
        diagramId,
        id,
    }) => {
        await deleteContent(TABLE_DB_RELATIONSHIPS, {
            diagram_id: diagramId,
            id,
        });
    };

    const deleteDiagramRelationships: StorageContext['deleteDiagramRelationships'] =
        async (diagramId) => {
            await deleteContent(TABLE_DB_RELATIONSHIPS, {
                diagram_id: diagramId,
            });
        };

    const addDependency: StorageContext['addDependency'] = async ({
        diagramId,
        dependency,
    }) => {
        await insertContent(
            TABLE_DB_DEPENDENCIES,
            diagramId,
            dependency.id,
            dependency
        );
    };

    const getDependency: StorageContext['getDependency'] = async ({
        diagramId,
        id,
    }) => {
        const row = await getContentRow<DBDependency>(
            TABLE_DB_DEPENDENCIES,
            diagramId,
            id
        );
        return row ? (row.payload as DBDependency) : undefined;
    };

    const updateDependency: StorageContext['updateDependency'] = async ({
        id,
        attributes,
    }) => {
        const result = await client
            .from(TABLE_DB_DEPENDENCIES)
            .select('*')
            .eq('user_id', userId)
            .eq('id', id)
            .maybeSingle();
        const row = await handle(result, 'load dependency for update');

        if (!row) return;

        const updated = {
            ...(row.payload as DBDependency),
            ...attributes,
        } as DBDependency;

        await updateContent(TABLE_DB_DEPENDENCIES, id, updated);
    };

    const deleteDependency: StorageContext['deleteDependency'] = async ({
        diagramId,
        id,
    }) => {
        await deleteContent(TABLE_DB_DEPENDENCIES, {
            diagram_id: diagramId,
            id,
        });
    };

    const deleteDiagramDependencies: StorageContext['deleteDiagramDependencies'] =
        async (diagramId) => {
            await deleteContent(TABLE_DB_DEPENDENCIES, {
                diagram_id: diagramId,
            });
        };

    const addArea: StorageContext['addArea'] = async ({ diagramId, area }) => {
        await insertContent(TABLE_AREAS, diagramId, area.id, area);
    };

    const getArea: StorageContext['getArea'] = async ({ diagramId, id }) => {
        const row = await getContentRow<Area>(TABLE_AREAS, diagramId, id);
        return row ? (row.payload as Area) : undefined;
    };

    const updateArea: StorageContext['updateArea'] = async ({
        id,
        attributes,
    }) => {
        const result = await client
            .from(TABLE_AREAS)
            .select('*')
            .eq('user_id', userId)
            .eq('id', id)
            .maybeSingle();
        const row = await handle(result, 'load area for update');
        if (!row) return;

        const updated = {
            ...(row.payload as Area),
            ...attributes,
        } as Area;

        await updateContent(TABLE_AREAS, id, updated);
    };

    const deleteArea: StorageContext['deleteArea'] = async ({
        diagramId,
        id,
    }) => {
        await deleteContent(TABLE_AREAS, { diagram_id: diagramId, id });
    };

    const deleteDiagramAreas: StorageContext['deleteDiagramAreas'] = async (
        diagramId
    ) => {
        await deleteContent(TABLE_AREAS, { diagram_id: diagramId });
    };

    const addCustomType: StorageContext['addCustomType'] = async ({
        diagramId,
        customType,
    }) => {
        await insertContent(
            TABLE_DB_CUSTOM_TYPES,
            diagramId,
            customType.id,
            customType
        );
    };

    const getCustomType: StorageContext['getCustomType'] = async ({
        diagramId,
        id,
    }) => {
        const row = await getContentRow<DBCustomType>(
            TABLE_DB_CUSTOM_TYPES,
            diagramId,
            id
        );
        return row ? (row.payload as DBCustomType) : undefined;
    };

    const updateCustomType: StorageContext['updateCustomType'] = async ({
        id,
        attributes,
    }) => {
        const result = await client
            .from(TABLE_DB_CUSTOM_TYPES)
            .select('*')
            .eq('user_id', userId)
            .eq('id', id)
            .maybeSingle();
        const row = await handle(result, 'load custom type for update');
        if (!row) return;

        const updated = {
            ...(row.payload as DBCustomType),
            ...attributes,
        } as DBCustomType;

        await updateContent(TABLE_DB_CUSTOM_TYPES, id, updated);
    };

    const deleteCustomType: StorageContext['deleteCustomType'] = async ({
        diagramId,
        id,
    }) => {
        await deleteContent(TABLE_DB_CUSTOM_TYPES, {
            diagram_id: diagramId,
            id,
        });
    };

    const deleteDiagramCustomTypes: StorageContext['deleteDiagramCustomTypes'] =
        async (diagramId) => {
            await deleteContent(TABLE_DB_CUSTOM_TYPES, {
                diagram_id: diagramId,
            });
        };

    return {
        getConfig,
        updateConfig,
        getDiagramFilter,
        updateDiagramFilter,
        deleteDiagramFilter,
        addDiagram,
        listDiagrams,
        getDiagram,
        updateDiagram,
        deleteDiagram,
        addTable,
        getTable,
        updateTable,
        putTable,
        deleteTable,
        listTables,
        deleteDiagramTables,
        addRelationship,
        getRelationship,
        updateRelationship,
        deleteRelationship,
        listRelationships,
        deleteDiagramRelationships,
        addDependency,
        getDependency,
        updateDependency,
        deleteDependency,
        listDependencies,
        deleteDiagramDependencies,
        addArea,
        getArea,
        updateArea,
        deleteArea,
        listAreas,
        deleteDiagramAreas,
        addCustomType,
        getCustomType,
        updateCustomType,
        deleteCustomType,
        listCustomTypes,
        deleteDiagramCustomTypes,
    } as StorageContext;
};
