"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const doIt = (schema, selection, typeMap = {}) => {
    const parsedSchema = (schema instanceof graphql_1.GraphQLSchema) ? schema : graphql_1.buildSchema(schema);
    const parsedSelection = graphql_1.parse(selection);
    function isNonNullable(type) {
        return type instanceof graphql_1.GraphQLNonNull;
    }
    ;
    function isList(type) {
        return type instanceof graphql_1.GraphQLList;
    }
    ;
    const wrapList = (type) => `Array<${type}>`;
    const TypeMap = Object.assign({
        ID: 'string',
        String: 'string',
        Boolean: 'boolean',
        Float: 'number',
        Int: 'number',
    }, typeMap);
    const convertVariable = (type, isNonNull = false, replacement = null) => {
        if (type.kind === 'ListType') {
            return wrapList(convertVariable(type.type, false, replacement)) + (isNonNull ? '' : ' | null');
        }
        else if (type.kind === 'NonNullType') {
            return convertVariable(type.type, true, replacement);
        }
        else {
            if (type.kind === 'NamedType' && type.name.kind === 'Name' && type.name.value) {
                const newType = parsedSchema.getType(type.name.value);
                if (newType instanceof graphql_1.GraphQLEnumType) {
                    const decl = newType.getValues().map(en => `'${en.value}'`).join(' | ');
                    return isNonNull ? decl : `${decl} | null`;
                }
            }
            const showValue = replacement ? replacement : type.name.value;
            const show = TypeMap[showValue] || (replacement ? showValue : 'any');
            return isNonNull ? show : `${show} | null`;
        }
    };
    const convertToType = (type, isNonNull = false, replacement = null) => {
        if (isList(type)) {
            return wrapList(convertToType(type.ofType, false, replacement)) + (isNonNull ? '' : ' | null');
        }
        else if (isNonNullable(type)) {
            return convertToType(type.ofType, true, replacement);
        }
        else if (type instanceof graphql_1.GraphQLEnumType) {
            const types = type.getValues().map(en => `'${en.value}'`).join(' | ');
            return isNonNull ? types : `${types} | null`;
        }
        else {
            const showValue = replacement ? replacement : type.toString();
            const show = TypeMap[showValue] || (replacement ? showValue : 'any');
            return isNonNull ? show : `${show} | null`;
        }
    };
    const getChildSelections = (operation, selection, indentation = '', parent) => {
        let str = '';
        let field;
        if (selection.kind === 'Field') {
            if (parent) {
                field = parent.getFields()[selection.name.value];
            }
            else {
                let operationFields;
                switch (operation) {
                    case 'query':
                        operationFields = parsedSchema.getQueryType();
                        break;
                    case 'mutation':
                        operationFields = parsedSchema.getMutationType();
                        break;
                    case 'subscription':
                        operationFields = parsedSchema.getSubscriptionType();
                        break;
                    default:
                        throw new Error('Unsupported Operation');
                }
                field = operationFields.getFields()[selection.name.value];
            }
            let selectionName = selection.name.value;
            if (selection.alias) {
                selectionName = selection.alias.value;
            }
            str += indentation + selectionName + ': ';
            if (!!selection.selectionSet) {
                let parent;
                const fieldType = graphql_1.getNamedType(field.type);
                if (graphql_1.isCompositeType(fieldType)) {
                    parent = fieldType;
                }
                let childType = '{\n';
                childType += selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation + '  ', parent)).join('\n');
                childType += '\n' + indentation + '}';
                // console.error(convertTest(field.type, false, childType));
                str += convertToType(field.type, false, childType) + ';';
            }
            else {
                str += convertToType(field.type) + ';';
            }
        }
        else {
            console.error('unsupported');
        }
        return str;
    };
    const getVariables = (variables) => {
        return variables.map(v => {
            const optional = v.type.kind !== 'NonNullType';
            return `${v.variable.name.value}${optional ? '?:' : ':'} ${convertVariable(v.type)};`;
        });
    };
    return parsedSelection.definitions.map(def => {
        if (def.kind === 'OperationDefinition') {
            const name = def.name ? def.name.value : 'Anonymous';
            let variableInterface = '';
            let iface = '';
            if (def.variableDefinitions && !!def.variableDefinitions.length) {
                const variables = getVariables(def.variableDefinitions);
                variableInterface = `export interface ${name}Input {
  ${variables.join('\n  ')}
}`;
            }
            iface += `export interface ${name} {\n`;
            let str = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel, '  '));
            iface += str.join('\n');
            iface += `\n}`;
            return {
                variables: variableInterface,
                interface: iface,
            };
        }
        else {
            console.error('unsupported definition');
        }
    });
};
exports.default = doIt;
//# sourceMappingURL=index.js.map