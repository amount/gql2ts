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
    const TypeMap = Object.assign({ ID: 'string', String: 'string', Boolean: 'boolean', Float: 'number', Int: 'number' }, typeMap);
    const printType = (type, isNonNull) => isNonNull ? type : `${type} | null`;
    const handleInputObject = (type, isNonNull) => {
        const variables = Object.keys(type.getFields()).map(k => type.getFields()[k]);
        const builder = `{\n${variables.map(v => `    ${v.name}?: ${convertToType(v.type)};`).join('\n')}\n  }`;
        return printType(builder, isNonNull);
    };
    const handleEnum = (type, isNonNull) => {
        const decl = type.getValues().map(en => `'${en.value}'`).join(' | ');
        return printType(decl, isNonNull);
    };
    const handleNamedTypeInput = (type, isNonNull) => {
        if (type.kind === 'NamedType' && type.name.kind === 'Name' && type.name.value) {
            const newType = parsedSchema.getType(type.name.value);
            if (newType instanceof graphql_1.GraphQLEnumType) {
                return handleEnum(newType, isNonNull);
            }
            else if (newType instanceof graphql_1.GraphQLInputObjectType) {
                return handleInputObject(newType, isNonNull);
            }
        }
    };
    const handleRegularType = (type, isNonNull, replacement) => {
        const typeValue = (typeof type.name === 'string') ? type.toString() : type.name.value;
        const showValue = replacement ? replacement : typeValue;
        const show = TypeMap[showValue] || (replacement ? showValue : 'any');
        return printType(show, isNonNull);
    };
    const convertVariable = (type, isNonNull = false, replacement = null) => {
        if (type.kind === 'ListType') {
            return wrapList(convertVariable(type.type, false, replacement)) + printType('', isNonNull);
        }
        else if (type.kind === 'NonNullType') {
            return convertVariable(type.type, true, replacement);
        }
        else {
            return handleNamedTypeInput(type, isNonNull) || handleRegularType(type, isNonNull, replacement);
        }
    };
    const convertToType = (type, isNonNull = false, replacement = null) => {
        if (isList(type)) {
            return wrapList(convertToType(type.ofType, false, replacement)) + printType('', isNonNull);
        }
        else if (isNonNullable(type)) {
            return convertToType(type.ofType, true, replacement);
        }
        else if (type instanceof graphql_1.GraphQLEnumType) {
            return handleEnum(type, isNonNull);
        }
        else {
            return handleRegularType(type, isNonNull, replacement);
        }
    };
    const UndefinedDirectives = new Set(['include', 'skip']);
    const isUndefinedFromDirective = (directives) => {
        if (!directives || !directives.length) {
            return false;
        }
        const badDirectives = directives.filter(d => !UndefinedDirectives.has(d.name.value));
        const hasDirectives = directives.some(d => UndefinedDirectives.has(d.name.value));
        if (badDirectives.length) {
            console.error('Found some unknown directives:');
            badDirectives.forEach(d => console.error(d.name.value));
        }
        if (hasDirectives) {
            return true;
        }
        else {
            return false;
        }
    };
    const wrapPartial = (possiblePartial) => {
        if (possiblePartial.isPartial) {
            return `Partial<${possiblePartial.iface}>`;
        }
        else {
            return possiblePartial.iface;
        }
    };
    const getOperationFields = (operation) => {
        switch (operation) {
            case 'query':
                return parsedSchema.getQueryType();
            case 'mutation':
                return parsedSchema.getMutationType();
            case 'subscription':
                return parsedSchema.getSubscriptionType();
            default:
                throw new Error('Unsupported Operation');
        }
    };
    const getChildSelections = (operation, selection, indentation = '', parent, isUndefined = false) => {
        let str = '';
        let field;
        let isFragment = false;
        let isPartial = false;
        let generatedTypeCount = 0;
        let complexTypes = [];
        if (selection.kind === 'Field') {
            if (parent && graphql_1.isCompositeType(parent)) {
                if (parent instanceof graphql_1.GraphQLUnionType) {
                    field = parent.getTypes().map(t => t.getFields()[selection.name.value]).find(z => !!z);
                }
                else {
                    field = parent.getFields()[selection.name.value];
                }
            }
            else {
                const operationFields = getOperationFields(operation);
                field = operationFields.getFields()[selection.name.value];
            }
            let selectionName = selection.name.value;
            if (selection.alias) {
                selectionName = selection.alias.value;
            }
            if (isUndefined || isUndefinedFromDirective(selection.directives)) {
                selectionName += '?';
            }
            str += indentation + selectionName + ': ';
            if (!!selection.selectionSet) {
                let parent;
                if (!field) {
                    console.log(selection, parent);
                }
                const fieldType = graphql_1.getNamedType(field.type);
                if (graphql_1.isCompositeType(fieldType)) {
                    parent = fieldType;
                }
                const selections = selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation + '  ', parent));
                const nonFragments = selections.filter(s => !s.isFragment);
                const fragments = selections.filter(s => s.isFragment);
                const andOps = [];
                complexTypes.push(...selections.map(sel => sel.complexTypes).reduce((acc, arr) => { acc.push(...arr); return acc; }, []));
                if (nonFragments.length) {
                    const nonPartialNonFragments = nonFragments.filter(nf => !nf.isPartial);
                    const partialNonFragments = nonFragments.filter(nf => nf.isPartial);
                    if (nonPartialNonFragments.length) {
                        let builder = '';
                        builder += '{\n';
                        builder += nonPartialNonFragments.map(f => f.iface).join('\n');
                        builder += `\n${indentation}}`;
                        andOps.push(builder);
                        const newInterfaceName = `SelectionOn${selection.name.value}${!!generatedTypeCount ? generatedTypeCount : ''}`;
                        generatedTypeCount += 1;
                        complexTypes.push({ iface: builder, isPartial: false, name: newInterfaceName });
                    }
                    if (partialNonFragments.length) {
                        let builder = '';
                        builder += 'Partial<{\n';
                        builder += partialNonFragments.map(f => f.iface).join('\n');
                        builder += `\n${indentation}}>`;
                        andOps.push(builder);
                        const newInterfaceName = `SelectionOn${selection.name.value}${!!generatedTypeCount ? generatedTypeCount : ''}`;
                        generatedTypeCount += 1;
                        complexTypes.push({ iface: builder, isPartial: true, name: newInterfaceName });
                    }
                }
                if (fragments.length) {
                    andOps.push(...fragments.map(wrapPartial));
                }
                const childType = andOps.join(' & ');
                str += convertToType(field.type, false, childType) + ';';
            }
            else {
                if (!field) {
                    console.log(selection);
                }
                str += convertToType(field.type) + ';';
            }
        }
        else if (selection.kind === 'FragmentSpread') {
            str = `IFragment${selection.name.value}`;
            isFragment = true;
            isPartial = isUndefinedFromDirective(selection.directives);
        }
        else if (selection.kind === 'InlineFragment') {
            const anon = !selection.typeCondition;
            if (!anon) {
                const typeName = selection.typeCondition.name.value;
                parent = parsedSchema.getType(typeName);
            }
            const selections = selection.selectionSet.selections.map(sel => getChildSelections(operation, sel, indentation, parent, !anon));
            let joinSelections = selections.map(s => s.iface).join('\n');
            isPartial = isUndefinedFromDirective(selection.directives);
            return {
                iface: joinSelections,
                isFragment,
                isPartial,
                complexTypes,
            };
        }
        else {
            throw new Error('Unsupported SelectionNode');
        }
        return {
            iface: str,
            isFragment,
            isPartial,
            complexTypes,
        };
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
            let ret = def.selectionSet.selections.map(sel => getChildSelections(def.operation, sel, '  '));
            let str = ret.map(x => x.iface);
            iface += str.join('\n');
            iface += `\n}`;
            return {
                variables: variableInterface,
                interface: iface,
            };
        }
        else if (def.kind === 'FragmentDefinition') {
            const onType = def.typeCondition.name.value;
            const foundType = parsedSchema.getType(onType);
            let ret = def.selectionSet.selections.map(sel => getChildSelections('query', sel, '  ', foundType));
            let str = ret.map(x => x.iface);
            let iface = `export interface IFragment${def.name.value} {
${str.join('\n')}
}`;
            return {
                interface: iface,
                variables: ''
            };
        }
        else {
            console.error('unsupported definition');
        }
    });
};
exports.default = doIt;
//# sourceMappingURL=index.js.map