// node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(`Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`);
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// node_modules/drizzle-orm/column.js
class Column {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = undefined;
  generated = undefined;
  generatedIdentity = undefined;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  shouldDisableInsert() {
    return this.config.generated !== undefined && this.config.generated.type !== "byDefault";
  }
}

// node_modules/drizzle-orm/column-builder.js
class ColumnBuilder {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: undefined,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: undefined,
      uniqueType: undefined,
      dataType,
      columnType,
      generated: undefined
    };
  }
  $type() {
    return this;
  }
  notNull() {
    this.config.notNull = true;
    return this;
  }
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $default = this.$defaultFn;
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $onUpdate = this.$onUpdateFn;
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  setName(name) {
    if (this.config.name !== "")
      return;
    this.config.name = name;
  }
}

// node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// node_modules/drizzle-orm/pg-core/foreign-keys.js
class ForeignKeyBuilder {
  static [entityKind] = "PgForeignKeyBuilder";
  reference;
  _onUpdate = "no action";
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === undefined ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === undefined ? "no action" : action;
    return this;
  }
  build(table) {
    return new ForeignKey(table, this);
  }
}

class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}

// node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom;i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// node_modules/drizzle-orm/pg-core/columns/common.js
class PgColumnBuilder extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife((ref2, actions2) => {
        const builder = new ForeignKeyBuilder(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      }, ref, actions);
    });
  }
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
}

class PgColumn extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
}

class ExtraConfigColumn extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: undefined
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
}

class IndexedColumn {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
}

class PgArrayBuilder extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(table, this.config, baseColumn);
  }
}

class PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map((v) => v === null ? null : is(this.baseColumn, PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v));
    if (isNestedArray)
      return a;
    return makePgArray(a);
  }
}

// node_modules/drizzle-orm/pg-core/columns/enum.js
class PgEnumObjectColumnBuilder extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  build(table) {
    return new PgEnumObjectColumn(table, this.config);
  }
}

class PgEnumObjectColumn extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}

class PgEnumColumnBuilder extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  build(table) {
    return new PgEnumColumn(table, this.config);
  }
}

class PgEnumColumn extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}
function pgEnum(enumName, input) {
  return Array.isArray(input) ? pgEnumWithSchema(enumName, [...input], undefined) : pgEnumObjectWithSchema(enumName, input, undefined);
}
function pgEnumWithSchema(enumName, values, schema) {
  const enumInstance = Object.assign((name) => new PgEnumColumnBuilder(name ?? "", enumInstance), {
    enumName,
    enumValues: values,
    schema,
    [isPgEnumSym]: true
  });
  return enumInstance;
}
function pgEnumObjectWithSchema(enumName, values, schema) {
  const enumInstance = Object.assign((name) => new PgEnumObjectColumnBuilder(name ?? "", enumInstance), {
    enumName,
    enumValues: Object.values(values),
    schema,
    [isPgEnumSym]: true
  });
  return enumInstance;
}

// node_modules/drizzle-orm/subquery.js
class Subquery {
  static [entityKind] = "Subquery";
  constructor(sql, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
}

// node_modules/drizzle-orm/version.js
var version = "0.45.2";

// node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife((otel2, rawTracer2) => rawTracer2.startActiveSpan(name, (span) => {
      try {
        return fn(span);
      } catch (e) {
        span.setStatus({
          code: otel2.SpanStatusCode.ERROR,
          message: e instanceof Error ? e.message : "Unknown error"
        });
        throw e;
      } finally {
        span.end();
      }
    }), otel, rawTracer);
  }
};

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");

class Table {
  static [entityKind] = "Table";
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  [TableName];
  [OriginalName];
  [Schema];
  [Columns];
  [ExtraConfigColumns];
  [BaseName];
  [IsAlias] = false;
  [IsDrizzleTable] = true;
  [ExtraConfigBuilder] = undefined;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}

// node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
  return value !== null && value !== undefined && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}

class StringChunk {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}

class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(schemaName === undefined ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]);
      }
    }
  }
  static [entityKind] = "SQL";
  decoder = noopDecoder;
  shouldInlineParams = false;
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === undefined) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === undefined || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === undefined ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === undefined || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== undefined) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === undefined) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  if(condition) {
    return condition ? this : undefined;
  }
}

class Name {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};

class Param {
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== undefined) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {

  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));

class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");

class View {
  static [entityKind] = "View";
  [ViewBaseConfig];
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/drizzle-orm/utils.js
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder;

// node_modules/drizzle-orm/pg-core/columns/int.common.js
class PgIntColumnBaseBuilder extends PgColumnBuilder {
  static [entityKind] = "PgIntColumnBaseBuilder";
  generatedAlwaysAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "always"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
  generatedByDefaultAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
}

// node_modules/drizzle-orm/pg-core/columns/bigint.js
class PgBigInt53Builder extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt53Builder";
  constructor(name) {
    super(name, "number", "PgBigInt53");
  }
  build(table) {
    return new PgBigInt53(table, this.config);
  }
}

class PgBigInt53 extends PgColumn {
  static [entityKind] = "PgBigInt53";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
}

class PgBigInt64Builder extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigInt64");
  }
  build(table) {
    return new PgBigInt64(table, this.config);
  }
}

class PgBigInt64 extends PgColumn {
  static [entityKind] = "PgBigInt64";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    return BigInt(value);
  }
}
function bigint(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "number") {
    return new PgBigInt53Builder(name);
  }
  return new PgBigInt64Builder(name);
}

// node_modules/drizzle-orm/pg-core/columns/bigserial.js
class PgBigSerial53Builder extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial53Builder";
  constructor(name) {
    super(name, "number", "PgBigSerial53");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  build(table) {
    return new PgBigSerial53(table, this.config);
  }
}

class PgBigSerial53 extends PgColumn {
  static [entityKind] = "PgBigSerial53";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
}

class PgBigSerial64Builder extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigSerial64");
    this.config.hasDefault = true;
  }
  build(table) {
    return new PgBigSerial64(table, this.config);
  }
}

class PgBigSerial64 extends PgColumn {
  static [entityKind] = "PgBigSerial64";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    return BigInt(value);
  }
}
function bigserial(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "number") {
    return new PgBigSerial53Builder(name);
  }
  return new PgBigSerial64Builder(name);
}

// node_modules/drizzle-orm/pg-core/columns/boolean.js
class PgBooleanBuilder extends PgColumnBuilder {
  static [entityKind] = "PgBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "PgBoolean");
  }
  build(table) {
    return new PgBoolean(table, this.config);
  }
}

class PgBoolean extends PgColumn {
  static [entityKind] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
}
function boolean(name) {
  return new PgBooleanBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/char.js
class PgCharBuilder extends PgColumnBuilder {
  static [entityKind] = "PgCharBuilder";
  constructor(name, config) {
    super(name, "string", "PgChar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  build(table) {
    return new PgChar(table, this.config);
  }
}

class PgChar extends PgColumn {
  static [entityKind] = "PgChar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === undefined ? `char` : `char(${this.length})`;
  }
}
function char(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgCharBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/cidr.js
class PgCidrBuilder extends PgColumnBuilder {
  static [entityKind] = "PgCidrBuilder";
  constructor(name) {
    super(name, "string", "PgCidr");
  }
  build(table) {
    return new PgCidr(table, this.config);
  }
}

class PgCidr extends PgColumn {
  static [entityKind] = "PgCidr";
  getSQLType() {
    return "cidr";
  }
}
function cidr(name) {
  return new PgCidrBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/custom.js
class PgCustomColumnBuilder extends PgColumnBuilder {
  static [entityKind] = "PgCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "PgCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  build(table) {
    return new PgCustomColumn(table, this.config);
  }
}

class PgCustomColumn extends PgColumn {
  static [entityKind] = "PgCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new PgCustomColumnBuilder(name, config, customTypeParams);
  };
}

// node_modules/drizzle-orm/pg-core/columns/date.common.js
class PgDateColumnBaseBuilder extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
}

// node_modules/drizzle-orm/pg-core/columns/date.js
class PgDateBuilder extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateBuilder";
  constructor(name) {
    super(name, "date", "PgDate");
  }
  build(table) {
    return new PgDate(table, this.config);
  }
}

class PgDate extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return new Date(value);
    return value;
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
}

class PgDateStringBuilder extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateStringBuilder";
  constructor(name) {
    super(name, "string", "PgDateString");
  }
  build(table) {
    return new PgDateString(table, this.config);
  }
}

class PgDateString extends PgColumn {
  static [entityKind] = "PgDateString";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return value;
    return value.toISOString().slice(0, -14);
  }
}
function date(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "date") {
    return new PgDateBuilder(name);
  }
  return new PgDateStringBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/double-precision.js
class PgDoublePrecisionBuilder extends PgColumnBuilder {
  static [entityKind] = "PgDoublePrecisionBuilder";
  constructor(name) {
    super(name, "number", "PgDoublePrecision");
  }
  build(table) {
    return new PgDoublePrecision(table, this.config);
  }
}

class PgDoublePrecision extends PgColumn {
  static [entityKind] = "PgDoublePrecision";
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  }
}
function doublePrecision(name) {
  return new PgDoublePrecisionBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/inet.js
class PgInetBuilder extends PgColumnBuilder {
  static [entityKind] = "PgInetBuilder";
  constructor(name) {
    super(name, "string", "PgInet");
  }
  build(table) {
    return new PgInet(table, this.config);
  }
}

class PgInet extends PgColumn {
  static [entityKind] = "PgInet";
  getSQLType() {
    return "inet";
  }
}
function inet(name) {
  return new PgInetBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/integer.js
class PgIntegerBuilder extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgIntegerBuilder";
  constructor(name) {
    super(name, "number", "PgInteger");
  }
  build(table) {
    return new PgInteger(table, this.config);
  }
}

class PgInteger extends PgColumn {
  static [entityKind] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
}
function integer(name) {
  return new PgIntegerBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/interval.js
class PgIntervalBuilder extends PgColumnBuilder {
  static [entityKind] = "PgIntervalBuilder";
  constructor(name, intervalConfig) {
    super(name, "string", "PgInterval");
    this.config.intervalConfig = intervalConfig;
  }
  build(table) {
    return new PgInterval(table, this.config);
  }
}

class PgInterval extends PgColumn {
  static [entityKind] = "PgInterval";
  fields = this.config.intervalConfig.fields;
  precision = this.config.intervalConfig.precision;
  getSQLType() {
    const fields = this.fields ? ` ${this.fields}` : "";
    const precision = this.precision ? `(${this.precision})` : "";
    return `interval${fields}${precision}`;
  }
}
function interval(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgIntervalBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/json.js
class PgJsonBuilder extends PgColumnBuilder {
  static [entityKind] = "PgJsonBuilder";
  constructor(name) {
    super(name, "json", "PgJson");
  }
  build(table) {
    return new PgJson(table, this.config);
  }
}

class PgJson extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}
function json(name) {
  return new PgJsonBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/jsonb.js
class PgJsonbBuilder extends PgColumnBuilder {
  static [entityKind] = "PgJsonbBuilder";
  constructor(name) {
    super(name, "json", "PgJsonb");
  }
  build(table) {
    return new PgJsonb(table, this.config);
  }
}

class PgJsonb extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}
function jsonb(name) {
  return new PgJsonbBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/line.js
class PgLineBuilder extends PgColumnBuilder {
  static [entityKind] = "PgLineBuilder";
  constructor(name) {
    super(name, "array", "PgLine");
  }
  build(table) {
    return new PgLineTuple(table, this.config);
  }
}

class PgLineTuple extends PgColumn {
  static [entityKind] = "PgLine";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return [Number.parseFloat(a), Number.parseFloat(b), Number.parseFloat(c)];
  }
  mapToDriverValue(value) {
    return `{${value[0]},${value[1]},${value[2]}}`;
  }
}

class PgLineABCBuilder extends PgColumnBuilder {
  static [entityKind] = "PgLineABCBuilder";
  constructor(name) {
    super(name, "json", "PgLineABC");
  }
  build(table) {
    return new PgLineABC(table, this.config);
  }
}

class PgLineABC extends PgColumn {
  static [entityKind] = "PgLineABC";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return { a: Number.parseFloat(a), b: Number.parseFloat(b), c: Number.parseFloat(c) };
  }
  mapToDriverValue(value) {
    return `{${value.a},${value.b},${value.c}}`;
  }
}
function line(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgLineBuilder(name);
  }
  return new PgLineABCBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/macaddr.js
class PgMacaddrBuilder extends PgColumnBuilder {
  static [entityKind] = "PgMacaddrBuilder";
  constructor(name) {
    super(name, "string", "PgMacaddr");
  }
  build(table) {
    return new PgMacaddr(table, this.config);
  }
}

class PgMacaddr extends PgColumn {
  static [entityKind] = "PgMacaddr";
  getSQLType() {
    return "macaddr";
  }
}
function macaddr(name) {
  return new PgMacaddrBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/macaddr8.js
class PgMacaddr8Builder extends PgColumnBuilder {
  static [entityKind] = "PgMacaddr8Builder";
  constructor(name) {
    super(name, "string", "PgMacaddr8");
  }
  build(table) {
    return new PgMacaddr8(table, this.config);
  }
}

class PgMacaddr8 extends PgColumn {
  static [entityKind] = "PgMacaddr8";
  getSQLType() {
    return "macaddr8";
  }
}
function macaddr8(name) {
  return new PgMacaddr8Builder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/numeric.js
class PgNumericBuilder extends PgColumnBuilder {
  static [entityKind] = "PgNumericBuilder";
  constructor(name, precision, scale) {
    super(name, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  build(table) {
    return new PgNumeric(table, this.config);
  }
}

class PgNumeric extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return value;
    return String(value);
  }
  getSQLType() {
    if (this.precision !== undefined && this.scale !== undefined) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === undefined) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
}

class PgNumericNumberBuilder extends PgColumnBuilder {
  static [entityKind] = "PgNumericNumberBuilder";
  constructor(name, precision, scale) {
    super(name, "number", "PgNumericNumber");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  build(table) {
    return new PgNumericNumber(table, this.config);
  }
}

class PgNumericNumber extends PgColumn {
  static [entityKind] = "PgNumericNumber";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "number")
      return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== undefined && this.scale !== undefined) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === undefined) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
}

class PgNumericBigIntBuilder extends PgColumnBuilder {
  static [entityKind] = "PgNumericBigIntBuilder";
  constructor(name, precision, scale) {
    super(name, "bigint", "PgNumericBigInt");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  build(table) {
    return new PgNumericBigInt(table, this.config);
  }
}

class PgNumericBigInt extends PgColumn {
  static [entityKind] = "PgNumericBigInt";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== undefined && this.scale !== undefined) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === undefined) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
}
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new PgNumericNumberBuilder(name, config?.precision, config?.scale) : mode === "bigint" ? new PgNumericBigIntBuilder(name, config?.precision, config?.scale) : new PgNumericBuilder(name, config?.precision, config?.scale);
}

// node_modules/drizzle-orm/pg-core/columns/point.js
class PgPointTupleBuilder extends PgColumnBuilder {
  static [entityKind] = "PgPointTupleBuilder";
  constructor(name) {
    super(name, "array", "PgPointTuple");
  }
  build(table) {
    return new PgPointTuple(table, this.config);
  }
}

class PgPointTuple extends PgColumn {
  static [entityKind] = "PgPointTuple";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return [Number.parseFloat(x), Number.parseFloat(y)];
    }
    return [value.x, value.y];
  }
  mapToDriverValue(value) {
    return `(${value[0]},${value[1]})`;
  }
}

class PgPointObjectBuilder extends PgColumnBuilder {
  static [entityKind] = "PgPointObjectBuilder";
  constructor(name) {
    super(name, "json", "PgPointObject");
  }
  build(table) {
    return new PgPointObject(table, this.config);
  }
}

class PgPointObject extends PgColumn {
  static [entityKind] = "PgPointObject";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return { x: Number.parseFloat(x), y: Number.parseFloat(y) };
    }
    return value;
  }
  mapToDriverValue(value) {
    return `(${value.x},${value.y})`;
  }
}
function point(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgPointTupleBuilder(name);
  }
  return new PgPointObjectBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0;c < hex.length; c += 2) {
    bytes.push(Number.parseInt(hex.slice(c, c + 2), 16));
  }
  return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0;i < 8; i++) {
    view.setUint8(i, bytes[offset + i]);
  }
  return view.getFloat64(0, true);
}
function parseEWKB(hex) {
  const bytes = hexToBytes(hex);
  let offset = 0;
  const byteOrder = bytes[offset];
  offset += 1;
  const view = new DataView(bytes.buffer);
  const geomType = view.getUint32(offset, byteOrder === 1);
  offset += 4;
  let _srid;
  if (geomType & 536870912) {
    _srid = view.getUint32(offset, byteOrder === 1);
    offset += 4;
  }
  if ((geomType & 65535) === 1) {
    const x = bytesToFloat64(bytes, offset);
    offset += 8;
    const y = bytesToFloat64(bytes, offset);
    offset += 8;
    return [x, y];
  }
  throw new Error("Unsupported geometry type");
}

// node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js
class PgGeometryBuilder extends PgColumnBuilder {
  static [entityKind] = "PgGeometryBuilder";
  constructor(name) {
    super(name, "array", "PgGeometry");
  }
  build(table) {
    return new PgGeometry(table, this.config);
  }
}

class PgGeometry extends PgColumn {
  static [entityKind] = "PgGeometry";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    return parseEWKB(value);
  }
  mapToDriverValue(value) {
    return `point(${value[0]} ${value[1]})`;
  }
}

class PgGeometryObjectBuilder extends PgColumnBuilder {
  static [entityKind] = "PgGeometryObjectBuilder";
  constructor(name) {
    super(name, "json", "PgGeometryObject");
  }
  build(table) {
    return new PgGeometryObject(table, this.config);
  }
}

class PgGeometryObject extends PgColumn {
  static [entityKind] = "PgGeometryObject";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    const parsed = parseEWKB(value);
    return { x: parsed[0], y: parsed[1] };
  }
  mapToDriverValue(value) {
    return `point(${value.x} ${value.y})`;
  }
}
function geometry(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgGeometryBuilder(name);
  }
  return new PgGeometryObjectBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/real.js
class PgRealBuilder extends PgColumnBuilder {
  static [entityKind] = "PgRealBuilder";
  constructor(name, length) {
    super(name, "number", "PgReal");
    this.config.length = length;
  }
  build(table) {
    return new PgReal(table, this.config);
  }
}

class PgReal extends PgColumn {
  static [entityKind] = "PgReal";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "real";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  };
}
function real(name) {
  return new PgRealBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/serial.js
class PgSerialBuilder extends PgColumnBuilder {
  static [entityKind] = "PgSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  build(table) {
    return new PgSerial(table, this.config);
  }
}

class PgSerial extends PgColumn {
  static [entityKind] = "PgSerial";
  getSQLType() {
    return "serial";
  }
}
function serial(name) {
  return new PgSerialBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/smallint.js
class PgSmallIntBuilder extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgSmallIntBuilder";
  constructor(name) {
    super(name, "number", "PgSmallInt");
  }
  build(table) {
    return new PgSmallInt(table, this.config);
  }
}

class PgSmallInt extends PgColumn {
  static [entityKind] = "PgSmallInt";
  getSQLType() {
    return "smallint";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  };
}
function smallint(name) {
  return new PgSmallIntBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/smallserial.js
class PgSmallSerialBuilder extends PgColumnBuilder {
  static [entityKind] = "PgSmallSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSmallSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  build(table) {
    return new PgSmallSerial(table, this.config);
  }
}

class PgSmallSerial extends PgColumn {
  static [entityKind] = "PgSmallSerial";
  getSQLType() {
    return "smallserial";
  }
}
function smallserial(name) {
  return new PgSmallSerialBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/text.js
class PgTextBuilder extends PgColumnBuilder {
  static [entityKind] = "PgTextBuilder";
  constructor(name, config) {
    super(name, "string", "PgText");
    this.config.enumValues = config.enum;
  }
  build(table) {
    return new PgText(table, this.config);
  }
}

class PgText extends PgColumn {
  static [entityKind] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
}
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgTextBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/time.js
class PgTimeBuilder extends PgDateColumnBaseBuilder {
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [entityKind] = "PgTimeBuilder";
  build(table) {
    return new PgTime(table, this.config);
  }
}

class PgTime extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === undefined ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
}
function time(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgTimeBuilder(name, config.withTimezone ?? false, config.precision);
}

// node_modules/drizzle-orm/pg-core/columns/timestamp.js
class PgTimestampBuilder extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  build(table) {
    return new PgTimestamp(table, this.config);
  }
}

class PgTimestamp extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === undefined ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return new Date(this.withTimezone ? value : value + "+0000");
    return value;
  }
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
}

class PgTimestampStringBuilder extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  build(table) {
    return new PgTimestampString(table, this.config);
  }
}

class PgTimestampString extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === undefined ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return value;
    const shortened = value.toISOString().slice(0, -1).replace("T", " ");
    if (this.withTimezone) {
      const offset = value.getTimezoneOffset();
      const sign = offset <= 0 ? "+" : "-";
      return `${shortened}${sign}${Math.floor(Math.abs(offset) / 60).toString().padStart(2, "0")}`;
    }
    return shortened;
  }
}
function timestamp(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "string") {
    return new PgTimestampStringBuilder(name, config.withTimezone ?? false, config.precision);
  }
  return new PgTimestampBuilder(name, config?.withTimezone ?? false, config?.precision);
}

// node_modules/drizzle-orm/pg-core/columns/uuid.js
class PgUUIDBuilder extends PgColumnBuilder {
  static [entityKind] = "PgUUIDBuilder";
  constructor(name) {
    super(name, "string", "PgUUID");
  }
  defaultRandom() {
    return this.default(sql`gen_random_uuid()`);
  }
  build(table) {
    return new PgUUID(table, this.config);
  }
}

class PgUUID extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
}
function uuid(name) {
  return new PgUUIDBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/varchar.js
class PgVarcharBuilder extends PgColumnBuilder {
  static [entityKind] = "PgVarcharBuilder";
  constructor(name, config) {
    super(name, "string", "PgVarchar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  build(table) {
    return new PgVarchar(table, this.config);
  }
}

class PgVarchar extends PgColumn {
  static [entityKind] = "PgVarchar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === undefined ? `varchar` : `varchar(${this.length})`;
  }
}
function varchar(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgVarcharBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js
class PgBinaryVectorBuilder extends PgColumnBuilder {
  static [entityKind] = "PgBinaryVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgBinaryVector");
    this.config.dimensions = config.dimensions;
  }
  build(table) {
    return new PgBinaryVector(table, this.config);
  }
}

class PgBinaryVector extends PgColumn {
  static [entityKind] = "PgBinaryVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
}
function bit(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgBinaryVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js
class PgHalfVectorBuilder extends PgColumnBuilder {
  static [entityKind] = "PgHalfVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgHalfVector");
    this.config.dimensions = config.dimensions;
  }
  build(table) {
    return new PgHalfVector(table, this.config);
  }
}

class PgHalfVector extends PgColumn {
  static [entityKind] = "PgHalfVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
}
function halfvec(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgHalfVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js
class PgSparseVectorBuilder extends PgColumnBuilder {
  static [entityKind] = "PgSparseVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgSparseVector");
    this.config.dimensions = config.dimensions;
  }
  build(table) {
    return new PgSparseVector(table, this.config);
  }
}

class PgSparseVector extends PgColumn {
  static [entityKind] = "PgSparseVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
}
function sparsevec(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgSparseVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js
class PgVectorBuilder extends PgColumnBuilder {
  static [entityKind] = "PgVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgVector");
    this.config.dimensions = config.dimensions;
  }
  build(table) {
    return new PgVector(table, this.config);
  }
}

class PgVector extends PgColumn {
  static [entityKind] = "PgVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
}
function vector(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/all.js
function getPgColumnBuilders() {
  return {
    bigint,
    bigserial,
    boolean,
    char,
    cidr,
    customType,
    date,
    doublePrecision,
    inet,
    integer,
    interval,
    json,
    jsonb,
    line,
    macaddr,
    macaddr8,
    numeric,
    point,
    geometry,
    real,
    serial,
    smallint,
    smallserial,
    text,
    time,
    timestamp,
    uuid,
    varchar,
    bit,
    halfvec,
    sparsevec,
    vector
  };
}

// node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = Symbol.for("drizzle:EnableRLS");

class PgTable extends Table {
  static [entityKind] = "PgTable";
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  [InlineForeignKeys] = [];
  [EnableRLS] = false;
  [Table.Symbol.ExtraConfigBuilder] = undefined;
  [Table.Symbol.ExtraConfigColumns] = {};
}
function pgTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new PgTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
    const colBuilder = colBuilderBase;
    colBuilder.setName(name2);
    const column = colBuilder.build(rawTable);
    rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
    return [name2, column];
  }));
  const builtColumnsForExtraConfig = Object.fromEntries(Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
    const colBuilder = colBuilderBase;
    colBuilder.setName(name2);
    const column = colBuilder.buildExtraConfigColumn(rawTable);
    return [name2, column];
  }));
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return Object.assign(table, {
    enableRLS: () => {
      table[PgTable.Symbol.EnableRLS] = true;
      return table;
    }
  });
}
var pgTable = (name, columns, extraConfig) => {
  return pgTableWithSchema(name, columns, extraConfig, undefined);
};

// node_modules/drizzle-orm/pg-core/indexes.js
class IndexBuilderOn {
  constructor(unique, name) {
    this.unique = unique;
    this.name = name;
  }
  static [entityKind] = "PgIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(columns.map((it) => {
      if (is(it, SQL)) {
        return it;
      }
      it = it;
      const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
      it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
      return clonedIndexedColumn;
    }), this.unique, false, this.name);
  }
  onOnly(...columns) {
    return new IndexBuilder(columns.map((it) => {
      if (is(it, SQL)) {
        return it;
      }
      it = it;
      const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
      it.indexConfig = it.defaultConfig;
      return clonedIndexedColumn;
    }), this.unique, true, this.name);
  }
  using(method, ...columns) {
    return new IndexBuilder(columns.map((it) => {
      if (is(it, SQL)) {
        return it;
      }
      it = it;
      const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
      it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
      return clonedIndexedColumn;
    }), this.unique, true, this.name, method);
  }
}

class IndexBuilder {
  static [entityKind] = "PgIndexBuilder";
  config;
  constructor(columns, unique, only, name, method = "btree") {
    this.config = {
      name,
      columns,
      unique,
      only,
      method
    };
  }
  concurrently() {
    this.config.concurrently = true;
    return this;
  }
  with(obj) {
    this.config.with = obj;
    return this;
  }
  where(condition) {
    this.config.where = condition;
    return this;
  }
  build(table) {
    return new Index(this.config, table);
  }
}

class Index {
  static [entityKind] = "PgIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
}
function index(name) {
  return new IndexBuilderOn(false, name);
}
function uniqueIndex(name) {
  return new IndexBuilderOn(true, name);
}

// node_modules/drizzle-orm/relations.js
class Relations {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
}
function relations(table, relations2) {
  return new Relations(table, (helpers) => Object.fromEntries(Object.entries(relations2(helpers)).map(([key, value]) => [
    key,
    value.withFieldName(key)
  ])));
}

// src/server/db/schema.ts
var adTypeEnum = pgEnum("ad_type", ["CAR", "VAN", "MOTORCYCLE", "BICYCLE", "THREE_WHEEL", "BUS", "LORRY", "HEAVY_DUTY", "TRACTOR", "AUTO_SERVICE", "RENTAL", "AUTO_PARTS", "MAINTENANCE", "BOAT"]);
var listingTypeEnum = pgEnum("listing_type", ["SELL", "WANT", "RENT", "HIRE"]);
var mediaTypeEnum = pgEnum("media_type", ["IMAGE", "VIDEO", "PDF", "OTHER"]);
var paymentTypeEnum = pgEnum("payment_type", ["BOOST", "FEATURE"]);
var boostTypeEnum = pgEnum("boost_type", ["BUMP", "TOP_AD", "URGENT", "FEATURED"]);
var boostStatusEnum = pgEnum("boost_status", ["PENDING", "ACTIVE", "EXPIRED", "REJECTED"]);
var paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "FAILED", "REFUNDED"]);
var adStatusEnum = pgEnum("ad_status", ["ACTIVE", "EXPIRED", "DRAFT", "PENDING_REVIEW", "REJECTED"]);
var notificationTypeEnum = pgEnum("notification_type", ["AD_EXPIRED", "AD_FEATURED", "MESSAGE", "REFERRAL", "REVIEW"]);
var sharePlatformEnum = pgEnum("share_platform", ["FACEBOOK", "TWITTER", "WHATSAPP", "LINKEDIN", "COPY_LINK"]);
var fuelTypeEnum = pgEnum("fuel_type", ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "GAS"]);
var transmissionEnum = pgEnum("transmission", ["MANUAL", "AUTOMATIC", "CVT"]);
var bodyTypeEnum = pgEnum("body_type", ["SALOON", "HATCHBACK", "STATION_WAGON", "SUV"]);
var bikeTypeEnum = pgEnum("bike_type", ["SCOOTER", "E_BIKE", "MOTORBIKES", "QUADRICYCLES"]);
var heavyDutyVehicleTypeEnum = pgEnum("heavy_duty_vehicle_type", ["BED_TRAILER", "BOWSER", "BULLDOZER", "CRANE", "DUMP_TRUCK", "EXCAVATOR", "LOADER", "OTHER"]);
var users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  organizationId: text("organization_id"),
  isOrganization: boolean("is_organization").default(false),
  phone: text("phone"),
  phoneVerified: text("phone_verified"),
  whatsappNumber: text("whatsapp_number"),
  province: text("province"),
  district: text("district"),
  city: text("city"),
  location: text("location")
});
var sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
  impersonatedBy: text("impersonated_by")
});
var accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});
var verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
});
var twoFactors = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" })
});
var organizations = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata")
});
var members = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").notNull()
});
var organizationFollowers = pgTable("organization_follower", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => ({
  unq: uniqueIndex("org_follower_unq").on(t.userId, t.organizationId)
}));
var invitations = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id").notNull().references(() => users.id, { onDelete: "cascade" })
});
var categories = pgTable("category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique()
});
var tags = pgTable("tag", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique()
});
var media = pgTable("media", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  uploaderId: text("uploader_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  type: mediaTypeEnum("type").notNull(),
  filename: text("filename"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var provinces = pgTable("province", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var districts = pgTable("district", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  provinceId: text("province_id").notNull().references(() => provinces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => ({
  unq: uniqueIndex("district_unq").on(t.name, t.provinceId)
}));
var cities = pgTable("city", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  districtId: text("district_id").notNull().references(() => districts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => ({
  unq: uniqueIndex("city_unq").on(t.name, t.districtId)
}));
var autoPartCategories = pgTable("auto_part_category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var manufactureYears = pgTable("manufacture_year", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  year: text("year").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var brandCarousels = pgTable("brand_carousel", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  imageUrl: text("image_url").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var vehicleModels = pgTable("vehicle_model", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  brand: text("brand"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => ({
  unq: uniqueIndex("vehicle_model_unq").on(t.name, t.brand)
}));
var ads = pgTable("ad", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizations.id),
  createdBy: text("created_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: adTypeEnum("type").notNull(),
  listingType: listingTypeEnum("listing_type").default("SELL").notNull(),
  price: doublePrecision("price"),
  published: boolean("published").default(false).notNull(),
  isDraft: boolean("is_draft").default(false).notNull(),
  boosted: boolean("boosted").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  boostExpiry: timestamp("boost_expiry"),
  featureExpiry: timestamp("feature_expiry"),
  status: adStatusEnum("status").default("ACTIVE").notNull(),
  expiryDate: timestamp("expiry_date"),
  rejectionDescription: text("rejection_description"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoSlug: text("seo_slug").unique(),
  categoryId: text("category_id").references(() => categories.id),
  tags: text("tags").array(),
  condition: text("condition"),
  brand: text("brand"),
  model: text("model"),
  grade: text("grade"),
  trimEdition: text("trim_edition"),
  manufacturedYear: text("manufactured_year"),
  modelYear: text("model_year"),
  mileage: doublePrecision("mileage"),
  engineCapacity: doublePrecision("engine_capacity"),
  fuelType: fuelTypeEnum("fuel_type"),
  transmission: transmissionEnum("transmission"),
  bodyType: bodyTypeEnum("body_type"),
  bikeType: bikeTypeEnum("bike_type"),
  vehicleType: heavyDutyVehicleTypeEnum("vehicle_type"),
  serviceType: text("service_type"),
  partType: text("part_type"),
  partName: text("part_name"),
  partCategoryId: text("part_category_id").references(() => autoPartCategories.id),
  compatibleVehicleType: text("compatible_vehicle_type"),
  maintenanceType: text("maintenance_type"),
  name: text("name"),
  phoneNumber: text("phone_number"),
  whatsappNumber: text("whatsapp_number"),
  termsAndConditions: boolean("terms_and_conditions"),
  location: text("location"),
  address: text("address"),
  province: text("province"),
  district: text("district"),
  city: text("city"),
  specialNote: text("special_note"),
  metadata: jsonb("metadata"),
  boostTypes: boostTypeEnum("boost_types").array(),
  bumpActive: boolean("bump_active").default(false).notNull(),
  topAdActive: boolean("top_ad_active").default(false).notNull(),
  urgentActive: boolean("urgent_active").default(false).notNull(),
  featuredActive: boolean("featured_active").default(false).notNull(),
  boostStatus: boostStatusEnum("boost_status"),
  boostRequestedAt: timestamp("boost_requested_at"),
  boostStartAt: timestamp("boost_start_at"),
  boostEndAt: timestamp("boost_end_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => ({
  statusIdx: index("ad_status_idx").on(t.status),
  listingTypeIdx: index("ad_listing_type_idx").on(t.listingType),
  brandIdx: index("ad_brand_idx").on(t.brand),
  modelIdx: index("ad_model_idx").on(t.model),
  categoryIdIdx: index("ad_category_id_idx").on(t.categoryId),
  createdByIdx: index("ad_created_by_idx").on(t.createdBy),
  orgIdIdx: index("ad_org_id_idx").on(t.orgId)
}));
var boostRequests = pgTable("boost_request", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  boostTypes: boostTypeEnum("boost_types").array().notNull(),
  bumpDays: integer("bump_days"),
  topAdDays: integer("top_ad_days"),
  urgentDays: integer("urgent_days"),
  featuredDays: integer("featured_days"),
  totalAmount: doublePrecision("total_amount").notNull(),
  bumpAmount: doublePrecision("bump_amount"),
  topAdAmount: doublePrecision("top_ad_amount"),
  urgentAmount: doublePrecision("urgent_amount"),
  featuredAmount: doublePrecision("featured_amount"),
  status: boostStatusEnum("status").default("PENDING").notNull(),
  approvedBy: text("approved_by"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var boostPricings = pgTable("boost_pricing", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boostType: boostTypeEnum("boost_type").notNull(),
  days: integer("days").notNull(),
  price: doublePrecision("price").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => ({
  unq: uniqueIndex("boost_pricing_unq").on(t.boostType, t.days)
}));
var revenueRecords = pgTable("revenue_record", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  boostRequestId: text("boost_request_id").notNull().unique().references(() => boostRequests.id, { onDelete: "cascade" }),
  adId: text("ad_id").notNull(),
  userId: text("user_id").notNull(),
  boostTypes: boostTypeEnum("boost_types").array().notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  bumpAmount: doublePrecision("bump_amount"),
  topAdAmount: doublePrecision("top_ad_amount"),
  urgentAmount: doublePrecision("urgent_amount"),
  featuredAmount: doublePrecision("featured_amount"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull()
});
var adRevisions = pgTable("ad_revision", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  version: integer("version").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var adAnalytics = pgTable("ad_analytics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().unique().references(() => ads.id),
  views: integer("views").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var adMedia = pgTable("ad_media", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  mediaId: text("media_id").notNull().references(() => media.id),
  order: integer("order").default(0).notNull()
}, (t) => ({
  unq: uniqueIndex("ad_media_unq").on(t.adId, t.mediaId)
}));
var payments = pgTable("payment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull(),
  amount: doublePrecision("amount").notNull(),
  sessionId: text("session_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var favorites = pgTable("favorite", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adId: text("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => ({
  unq: uniqueIndex("favorite_unq").on(t.userId, t.adId),
  userIdx: index("favorite_user_idx").on(t.userId),
  adIdx: index("favorite_ad_idx").on(t.adId)
}));
var savedSearches = pgTable("saved_search", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var geoHeatmaps = pgTable("geo_heatmap", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var messages = pgTable("message", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  adId: text("ad_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var userNotifications = pgTable("notification", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var shareEvents = pgTable("share_event", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adId: text("ad_id").notNull().references(() => ads.id),
  platform: sharePlatformEnum("platform").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sharedAt: timestamp("shared_at").defaultNow().notNull()
});
var reports = pgTable("report", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  adId: text("ad_id").notNull().references(() => ads.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var auditLogs = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  orgId: text("org_id").references(() => organizations.id),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var verificationCodes = pgTable("verification_code", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => ({
  idx: index("vc_email_code_idx").on(t.email, t.code)
}));
var newsletters = pgTable("newsletter", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainContent: text("plain_content"),
  recipientCount: integer("recipient_count").default(0).notNull(),
  recipientEmails: text("recipient_emails").array(),
  sentBy: text("sent_by").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var vehicleGrades = pgTable("vehicle_grade", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  model: text("model"),
  brand: text("brand"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => ({
  unq: uniqueIndex("vehicle_grade_unq").on(t.name, t.model, t.brand)
}));
var tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  done: boolean("done").default(false).notNull()
});
var favoritesRelations = relations(favorites, ({ one }) => ({
  ad: one(ads, { fields: [favorites.adId], references: [ads.id] }),
  user: one(users, { fields: [favorites.userId], references: [users.id] })
}));
var adsRelations = relations(ads, ({ one, many }) => ({
  org: one(organizations, { fields: [ads.orgId], references: [organizations.id] }),
  user: one(users, { fields: [ads.userId], references: [users.id] }),
  category: one(categories, { fields: [ads.categoryId], references: [categories.id] }),
  media: many(adMedia),
  reports: many(reports),
  favorites: many(favorites),
  revisions: many(adRevisions)
}));
var adMediaRelations = relations(adMedia, ({ one }) => ({
  ad: one(ads, { fields: [adMedia.adId], references: [ads.id] }),
  media: one(media, { fields: [adMedia.mediaId], references: [media.id] })
}));
var reportsRelations = relations(reports, ({ one }) => ({
  ad: one(ads, { fields: [reports.adId], references: [ads.id] }),
  reporter: one(users, { fields: [reports.userId], references: [users.id] })
}));
var organizationsRelations = relations(organizations, ({ many }) => ({
  ads: many(ads)
}));
var categoriesRelations = relations(categories, ({ many }) => ({
  ads: many(ads)
}));
var usersRelations = relations(users, ({ many }) => ({
  ads: many(ads),
  favorites: many(favorites),
  reports: many(reports),
  boostRequests: many(boostRequests),
  revenueRecords: many(revenueRecords)
}));
var boostRequestsRelations = relations(boostRequests, ({ one }) => ({
  ad: one(ads, { fields: [boostRequests.adId], references: [ads.id] }),
  user: one(users, { fields: [boostRequests.userId], references: [users.id] })
}));
var revenueRecordsRelations = relations(revenueRecords, ({ one }) => ({
  ad: one(ads, { fields: [revenueRecords.adId], references: [ads.id] }),
  user: one(users, { fields: [revenueRecords.userId], references: [users.id] }),
  boostRequest: one(boostRequests, { fields: [revenueRecords.boostRequestId], references: [boostRequests.id] })
}));
export {
  verifications,
  verificationCodes,
  vehicleModels,
  vehicleGrades,
  usersRelations,
  users,
  userNotifications,
  twoFactors,
  transmissionEnum,
  tasks,
  tags,
  sharePlatformEnum,
  shareEvents,
  sessions,
  savedSearches,
  revenueRecordsRelations,
  revenueRecords,
  reportsRelations,
  reports,
  provinces,
  payments,
  paymentTypeEnum,
  paymentStatusEnum,
  organizationsRelations,
  organizations,
  organizationFollowers,
  notificationTypeEnum,
  newsletters,
  messages,
  members,
  mediaTypeEnum,
  media,
  manufactureYears,
  listingTypeEnum,
  invitations,
  heavyDutyVehicleTypeEnum,
  geoHeatmaps,
  fuelTypeEnum,
  favoritesRelations,
  favorites,
  districts,
  cities,
  categoriesRelations,
  categories,
  brandCarousels,
  boostTypeEnum,
  boostStatusEnum,
  boostRequestsRelations,
  boostRequests,
  boostPricings,
  bodyTypeEnum,
  bikeTypeEnum,
  autoPartCategories,
  auditLogs,
  adsRelations,
  ads,
  adTypeEnum,
  adStatusEnum,
  adRevisions,
  adMediaRelations,
  adMedia,
  adAnalytics,
  accounts
};
