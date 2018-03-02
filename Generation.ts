class CodeCSharp implements IBuildCode {
    buildCode(pseudoCode: PseudoCode): string {
        var supportEntityFramework = true;
        var codeClass = pseudoCode.codeClass;

        var builtinTypes = ["int", "long", "short", "guid", "bool", "float", "double", "byte", "char", "string", "datetime", "timespan", "decimal"];

        function isBuiltinType(typeName: string): boolean {
            var typeName = typeName.toLowerCase();
            return builtinTypes.indexOf(typeName) >= 0;
        }

        var enumNames: string[] = [];
        pseudoCode.enums.forEach((e) => {
            enumNames.push(e.name.toLowerCase());
        });

        function isEnum(typeName: string): boolean {
            var typeName = typeName.toLowerCase();
            return enumNames.indexOf(typeName) >= 0;
        }

        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;

        var sb = new StringBuilder();

        sb.appendLine("public class " + codeClass.name);
        sb.appendLine("{");

        // properties
        codeClass.properties.forEach((p) => {
            if (supportEntityFramework) {
                var typeLower = p.type.toLowerCase();
                var nameLower = p.name.toLowerCase();
                if (nameLower === "id") {
                    sb.appendLine(indent1 + "[Key]");
                }
                else if (typeLower == "string") {
                    sb.appendLine(indent1 + "[Required(AllowEmptyStrings = true)]");
                    sb.appendLine(indent1 + "[StringLength(1024)]");
                }
                else if ((!isBuiltinType(typeLower)) && (!isEnum(typeLower))) {
                    sb.appendLine(indent1 + "[NotMapped]");
                }
            }

            sb.appendLine(indent1 + "public " + p.type + " " + p.name + " { get; set; }");
        });

        // Format class
        sb.appendLine();
        sb.appendLine(indent1 + "public class Format");
        sb.appendLine(indent1 + "{");
        codeClass.properties.forEach((p) => {
            var formatType = (isBuiltinType(p.type) || isEnum(p.type)) ? "bool" : p.typeWithoutList + ".Format";
            sb.appendLine(indent2 + "public " + formatType + " " + p.name + " { get; set; }");
        });
        sb.appendLine(indent1 + "}");

        // Default constructor
        sb.appendLine();
        sb.appendLine(indent1 + "public " + codeClass.name + "()");
        sb.appendLine(indent1 + "{");
        sb.appendLine(indent1 + "}");

        // Constructor for db reader
        sb.appendLine();
        sb.append(indent1 + "public " + codeClass.name + "(DbDataReader reader");
        codeClass.properties.forEach((p) => {
            sb.appendLine(",");
            sb.append(indent2 + "int " + camelNaming(p.name) + "Index = -1");
        });
        sb.appendLine(")");
        sb.appendLine(indent1 + "{");
        codeClass.properties.forEach((p) => {
            if ((!isBuiltinType(p.type)) && (!isEnum(p.type))) {
                return;
            }

            var indexName = camelNaming(p.name) + "Index";
            sb.appendLine(indent2 + "if (" + indexName + " >= 0)");
            sb.appendLine(indent2 + "{");
            if (isBuiltinType(p.type)) {
                sb.appendLine(indent3 + p.name + " = (" + p.type + ")reader[" + indexName + "];");
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent3 + p.name + " = (" + p.type + ")(long)reader[" + indexName + "];");
            }
            sb.appendLine(indent2 + "}");
            sb.appendLine();
        });
        sb.appendLine(indent1 + "}");

        // Serialize method for object
        sb.appendLine();
        sb.appendLine(indent1 + "public static void Serialize(JsonWriter writer, " + codeClass.name + " item, Format format)");
        sb.appendLine(indent1 + "{");
        sb.appendLine(indent2 + "writer.WriteStartObject();");
        sb.appendLine();
        codeClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                sb.appendLine(indent2 + "if (format." + p.name + ")");
                sb.appendLine(indent2 + "{");
                sb.appendLine(indent3 + "writer.Write(\"" + p.name + "\", item." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if (format." + p.name + ")");
                sb.appendLine(indent2 + "{");
                sb.appendLine(indent3 + "writer.Write(\"" + p.name + "\", (long)item." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else {
                sb.appendLine(indent2 + "if ((format." + p.name + " != null) && (item." + p.name + " != null))");
                sb.appendLine(indent2 + "{");
                sb.appendLine(indent3 + "writer.WriteName(\"" + p.name + "\");");
                sb.appendLine(indent3 + p.typeWithoutList + ".Serialize(writer, item." + p.name + ", format." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            sb.appendLine();
        });
        sb.appendLine(indent2 + "writer.WriteEndObject();");
        sb.appendLine(indent1 + "}");

        // Serialize method for array
        sb.appendLine();
        sb.appendLine(indent1 + "public static void Serialize(JsonWriter writer, IList<" + codeClass.name + "> list, Format format)");
        sb.appendLine(indent1 + "{");
        sb.appendLine(indent2 + "writer.WriteStartArray();");
        sb.appendLine();
        sb.appendLine(indent2 + "foreach (var item in list)");
        sb.appendLine(indent2 + "{");
        sb.appendLine(indent3 + "Serialize(writer, item, format);");
        sb.appendLine(indent2 + "}");
        sb.appendLine();
        sb.appendLine(indent2 + "writer.WriteEndArray();");
        sb.appendLine(indent1 + "}");

        // Deserialize method for object
        sb.appendLine();
        sb.appendLine(indent1 + "public static " + codeClass.name + " Deserialize(JsonObject json)");
        sb.appendLine(indent1 + "{");
        sb.appendLine(indent2 + "var item = new " + codeClass.name + "()");
        sb.appendLine(indent2 + "{");
        codeClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                var jsonParseMethod = "";
                switch (p.type.toLowerCase()) {
                    case "int": jsonParseMethod = "GetIntValue"; break;
                    case "long": jsonParseMethod = "GetLongValue"; break;
                    case "datetime": jsonParseMethod = "GetDateTimeValue"; break;
                    case "float": jsonParseMethod = "GetFloatValue"; break;
                    case "double": jsonParseMethod = "GetDoubleValue"; break;
                    case "string": jsonParseMethod = "GetStringValue"; break;
                    case "byte": jsonParseMethod = "GetByteValue"; break;
                    case "char": jsonParseMethod = "GetCharValue"; break;
                    case "bool": jsonParseMethod = "GetBooleanValue"; break;
                    case "timespan": jsonParseMethod = "GetTimeSpanValue"; break;
                    case "guid": jsonParseMethod = "GetGuidValue"; break;
                }
                sb.appendLine(indent3 + p.name + " = json." + jsonParseMethod + "(\"" + p.name + "\"),");
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent3 + p.name + " = (" + p.type + ")json.GetLongValue(\"" + p.name + "\", (long)" + p.type + ".DefaultValue),");
            }
            else {
            }
        });
        sb.appendLine(indent2 + "};");
        sb.appendLine();
        codeClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
            }
            else if (isEnum(p.type)) {
            }
            else {
                var jsonName = camelNaming(p.name) + "Json";
                if (p.isList) {
                    sb.appendLine(indent2 + "var " + jsonName + " = json.GetJsonArray(\"" + p.name + "\");");
                }
                else {
                    sb.appendLine(indent2 + "var " + jsonName + " = json.GetJsonObject(\"" + p.name + "\");");
                }
                sb.appendLine(indent2 + "if (" + jsonName + " != null)");
                sb.appendLine(indent2 + "{");
                sb.appendLine(indent3 + "item." + p.name + " = " + p.typeWithoutList + ".Deserialize(" + jsonName + ");");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine(indent2 + "return item;");
        sb.appendLine(indent1 + "}");

        // Deserialize method for array
        sb.appendLine();
        sb.appendLine(indent1 + "public static List<" + codeClass.name + "> Deserialize(JsonArray jsonArray)");
        sb.appendLine(indent1 + "{");
        sb.appendLine(indent2 + "var list = new List<" + codeClass.name + ">();");
        sb.appendLine();
        sb.appendLine(indent2 + "foreach (JsonObject json in jsonArray)");
        sb.appendLine(indent2 + "{");
        sb.appendLine(indent3 + "list.Add(Deserialize(json));");
        sb.appendLine(indent2 + "}");
        sb.appendLine();
        sb.appendLine(indent2 + "return list;");
        sb.appendLine(indent1 + "}");

        sb.appendLine("}");
        sb.appendLine();

        return sb.toString();
    }
}

class CodeObjectiveC implements IBuildCode {
    buildCode(pseudoCode: PseudoCode): string {
        var codeOCClass = pseudoCode.codeClass;

        var builtinTypes = ["int", "long", "short", "guid", "bool", "float", "double", "byte", "char", "string", "datetime", "timespan", "decimal"];

        var enumNames: string[] = [];
        pseudoCode.enums.forEach((e) => {
            enumNames.push(e.name.toLowerCase());
        });

        function isBuiltinType(typeName: string): boolean {
            var typeName = typeName.toLowerCase();
            return builtinTypes.indexOf(typeName) >= 0;
        }

        var enumNames: string[] = [];
        pseudoCode.enums.forEach((e) => {
            enumNames.push(e.name.toLowerCase());
        });

        function isEnum(typeName: string): boolean {
            var typeName = typeName.toLowerCase();
            return enumNames.indexOf(typeName) >= 0;
        }

        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;

        var sb = new StringBuilder();
        sb.appendLine("@interface " + codeOCClass.name + " : NSObject");
        sb.appendLine("");

        // properties definition
        codeOCClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                if (p.name === "Id") {
                    switch (p.type.toLowerCase()) {
                        case "int": sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(codeOCClass.name) + p.name); break;
                        case "string": sb.appendLine("@property (nonatomic, strong) " + padRight("NSString", 15, " ") + "*" + camelNaming(codeOCClass.name) + p.name); break;
                        case "guid": sb.appendLine("@property (nonatomic, strong) " + padRight(p.type, 15, " ") + "*" + camelNaming(codeOCClass.name) + p.name); break;
                    }
                } else {
                    switch (p.type.toLowerCase()) {
                        case "int": sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(p.name)); break;
                        case "long": sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(p.name)); break;
                        case "timespan":
                        case "datetime": sb.appendLine("@property (nonatomic, strong) " + padRight("NSDate", 15, " ") + "*" + camelNaming(p.name)); break;
                        case "float": sb.appendLine("@property (nonatomic, assign) " + padRight("float", 15, " ") + camelNaming(p.name)); break;
                        case "double": sb.appendLine("@property (nonatomic, assign) " + padRight("double", 15, " ") + camelNaming(p.name)); break;
                        case "string": sb.appendLine("@property (nonatomic, strong) " + padRight("NSString", 15, " ") + "*" + camelNaming(p.name)); break;
                        case "byte": sb.appendLine("@property (nonatomic, assign) " + padRight("byte", 15, " ") + camelNaming(p.name)); break;
                        case "char": sb.appendLine("@property (nonatomic, assign) " + padRight("char", 15, " ") + camelNaming(p.name)); break;
                        case "boolean":
                        case "bool": sb.appendLine("@property (nonatomic, assign) " + padRight("BOOL", 15, " ") + camelNaming(p.name)); break;
                        case "guid": sb.appendLine("@property (nonatomic, strong) " + padRight(p.type, 15, " ") + "*" + camelNaming(p.name)); break;
                    }
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(p.name));
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine("@property (nonatomic, strong) " + padRight("NSArray", 15, " ") + "*" + camelNaming(p.name));
            }
            else {

            }
        });

        sb.appendLine("@property (nonatomic, assign) " + padRight(codeOCClass.name + "Format", 15, " ") + "*format");

        sb.appendLine();

        // Serialize method definition
        sb.appendLine("+ (NSDictionary *)serializeEntity:(" + codeOCClass.name + " *)entity");
        sb.appendLine("+ (NSArray *)serializeWithEntityArray:(NSArray *)entityArray");
        sb.appendLine();
        sb.appendLine("+ (" + codeOCClass.name + " *)deserializeFromDictionary:(NSDictionary *)dataDict");
        sb.appendLine("+ (NSArray *)deserializeFromDataArray:(NSArray *)dataArray");

        sb.appendLine();
        sb.appendLine("@end");
        sb.appendLine();

        // properties format definition
        sb.appendLine("@interface " + codeOCClass.name + "Format : NSObject");
        sb.appendLine();

        codeOCClass.properties.forEach((p) => {
            if (p.name === "Id") {
                sb.appendLine("@property(nonatomic, assign) BOOL  " + camelNaming(codeOCClass.name) + "Id" + ";");
            } else {
                sb.appendLine("@property(nonatomic, assign) BOOL  " + camelNaming(p.name) + ";");
            }
        });

        sb.appendLine();
        sb.appendLine("- (void)confirmAll;");
        sb.appendLine();
        sb.appendLine("@end");

        sb.appendLine();
        sb.appendLine();

        // Serialize method for object
        sb.appendLine("@implementation " + codeOCClass.name);
        sb.appendLine();

        // four method
        // serializeEntity
        sb.appendLine("+ (NSDictionary *)serializeEntity:(" + codeOCClass.name + " *)entity");
        sb.appendLine("{");
        sb.appendLine(indent1 + "NSMutableDictionary *mDict = [NSMutableDictionary dictionary];");
        sb.appendLine();

        codeOCClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                if (p.name === "Id") {
                    switch (p.type.toLowerCase()) {
                        case "int":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(codeOCClass.name) + "Id && entity." + camelNaming(codeOCClass.name) + "Id) {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + camelNaming(codeOCClass.name) + "Id" + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "string":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(codeOCClass.name) + "Id && entity." + camelNaming(codeOCClass.name) + "Id) {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + camelNaming(codeOCClass.name) + "Id" + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "guid":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(codeOCClass.name) + "Id && entity." + camelNaming(codeOCClass.name) + "Id) {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + camelNaming(codeOCClass.name) + "Id" + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                    }
                } else {
                    switch (p.type.toLowerCase()) {
                        case "int":
                        case "long":
                        case "float":
                        case "double":
                        case "byte":
                        case "char":
                        case "bool":
                        case "boolean":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(p.name) + " && entity." + camelNaming(p.name) + ") {");
                            sb.appendLine(indent2 + "mDict[@\"" + camelNaming(p.name) + "\"] = @(entity." + camelNaming(p.name) + ");");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "guid":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(p.name));
                            sb.appendLine(indent2 + "mDict[@\"" + camelNaming(p.name) + "\"] = entity." + camelNaming(p.name) + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "timespan":
                        case "datetime":
                            sb.appendLine(indent1 + "if (entity.format." + camelNaming(p.name) + " && entity." + camelNaming(p.name) + ") {");
                            sb.appendLine(indent2 + "NSDateFormatter *formatter = [[NSDateFormatter alloc] init];");
                            sb.appendLine(indent2 + "formatter.dateFormat = @\"yyyy-MM-dd HH:mm:ss\";");
                            sb.appendLine(indent2 + "NSString *dateString = [formatter stringFromDate:entity." + p.name + "];");
                            sb.appendLine(indent3 + "mDict[@\"" + p.name + "\"] = dateString;");
                            sb.appendLine(indent2 + "}");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "string":
                            sb.appendLine(indent1 + "if (entity.format." + camelNaming(p.name) + " && entity." + camelNaming(p.name) + ") {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + p.name + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                    }
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "if(entity.format." + camelNaming(p.name) + ") {");
                sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = @(entity." + camelNaming(p.name) + ");");
                sb.appendLine(indent1 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "if (entity.format." + camelNaming(p.name) + " && " + "entity." + camelNaming(p.name) + ".count > 0) {");
                sb.appendLine(indent2 + "NSArray *array = [" + codeOCClass.name + " serializeWithEntityArray:entity." + p.name + "];");
                sb.appendLine(indent2 + "if (array) {");
                sb.appendLine(indent3 + "mDict[@\"" + p.name + "\"] = array;");
                sb.appendLine(indent2 + "}");
                sb.appendLine(indent1 + "}");
            } else {
                sb.appendLine(indent1 + "if (entity.format." + p.name + " && entity." + p.name + ") {");
                sb.appendLine(indent2 + "NSDictory *Dict = [" + p.type + "serializeEntity:entity." + p.name + "];");
                sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = Dict;");
                sb.appendLine(indent1 + "}");
            }
        });

        sb.appendLine(indent1 + "return mDict.copy;");
        sb.appendLine("}");
        sb.appendLine();

        // serializeWithEntityArray
        sb.appendLine("+ (NSArray *)serializeWithEntityArray:(NSArray *)entityArray");
        sb.appendLine("{");
        sb.appendLine(indent1 + "NSMutableArray *mArray = [NSMutableArray array];");
        sb.appendLine(indent2 + "for (" + codeOCClass.name + " *entity in entityArray) {");
        sb.appendLine(indent3 + "NSDictionary *entityInfoDcit = [" + codeOCClass.name + " serializeEntity:entity];");
        sb.appendLine(indent3 + "if (entityInfoDict) {");
        sb.appendLine(indent3 + indent1 + "[mArray addObject:entityInfoDict];");
        sb.appendLine(indent3 + "}");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent1 + "return mArray.copy;");
        sb.appendLine("}");
        sb.appendLine();


        //deserializeFromDataArray
        sb.appendLine("+ (NSArray *)deserializeFromDataArray:(NSArray *)dataArray");
        sb.appendLine("{");
        sb.appendLine(indent1 + "NSMutableArray *mArray = [NSMutableArray array];");
        sb.appendLine(indent1 + "for (NSDictionary *entityInfoDict in dataArray) {");
        sb.appendLine(indent2 + codeOCClass.name + " *entity = [" + codeOCClass.name + " deserializeFromDictionary:entityInfoDict];");
        sb.appendLine(indent2 + "if (entity) {");
        sb.appendLine(indent3 + "[mArray addObject:entity];");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent1 + "}");
        sb.appendLine(indent1 + "return mArray.copy;");
        sb.appendLine("}");
        sb.appendLine();

        // deserializeFromDictionary
        sb.appendLine("+ (" + codeOCClass.name + " *)deserializeFromDictionary: (NSDictionary *)dataDict");
        sb.appendLine("{");
        sb.appendLine(indent1 + codeOCClass.name + " *entity = [[" + codeOCClass.name + " alloc] init];");
        sb.appendLine();
        var index = 1;
        codeOCClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                if (p.name === "Id") {
                    var propertyName = camelNaming(p.name) + Number;
                    switch (p.type.toLowerCase()) {
                        case "int":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + camelNaming(codeOCClass.name) + "Id\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + camelNaming(codeOCClass.name) + "Id = " + propertyName + ".intValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "string":
                            sb.appendLine(indent1 + "entity." + camelNaming(codeOCClass.name) + "Id = [dataDict stringForKey:@\"" + camelNaming(codeOCClass.name) + "Id\"]");
                            break;
                        case "guid":
                            sb.appendLine(indent1 + "entity." + camelNaming(codeOCClass.name) + "Id = [dataDict guidForKey:@\"" + camelNaming(codeOCClass.name) + "Id\"]");
                            break;
                    }
                } else {
                    switch (p.type.toLowerCase()) {
                        case "guid":
                            sb.appendLine(indent1 + "entity." + p.name + " = [dataDict guidForKey:@\"" + p.name + "\"]");
                            sb.appendLine();
                            break;
                        case "int":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".intValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "long":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".longValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "float":
                            sb.appendLine(indent1 + "NSNumber *" + propertyName + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + propertyName + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".floatValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "double":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".doubleValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "bool":
                        case "boolean":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".boolValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "timespan":
                        case "datetime":
                            sb.appendLine(indent1 + "NSString *dateString = [dataDict stringForKey:@\"" + p.name + "\"];");
                            sb.appendLine(indent1 + "if (dateString) {");
                            sb.appendLine(indent2 + "NSDateFormatter *formatter = [[NSDateFormatter alloc] init];");
                            sb.appendLine(indent2 + "formatter.dateFormat = @\"yyyy-MM-dd HH:mm:ss\";");
                            sb.appendLine(indent2 + "entity." + p.name + " = [formatter dateFromString:dateString];");
                            sb.appendLine(indent1 + "}");
                            sb.appendLine();
                            break;
                        case "string":
                            sb.appendLine(indent1 + "entity." + p.name + " = [dataDict stringForKey:@\"" + p.name + "\"]");
                            sb.appendLine();
                            break;
                    }
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "NSNumber *" + camelNaming(p.name) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                sb.appendLine(indent1 + "if (" + camelNaming(p.name) + ") {");
                sb.appendLine(indent2 + "entity." + p.name + " = " + p.name + ".integetValue;");
                sb.appendLine(indent1 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "NSArray *array = [dataDict arrayForKey:@\"" + p.name + "\"];");
                sb.appendLine(indent1 + "if (array.count > 0) {");
                sb.appendLine(indent2 + "entity." + p.name + " = [" + codeOCClass.name + " deserializeFromDataArray:array];");
                sb.appendLine(indent1 + "}");
                sb.appendLine();
            }
            else {
                sb.appendLine(indent1 + "NSDictionary *Dict = [dataDict dictionaryForKey:@\"" + p.name + "\"];");
                sb.appendLine(indent1 + "if (Dict.count > 0) {");
                sb.appendLine(indent2 + "entity." + p.name + " = [" + p.type + " deserializeFromDictionary:Dict];");
                sb.appendLine(indent1 + "}");
            }
        });

        sb.appendLine(indent1 + "return entity;")
        sb.appendLine("}");
        sb.appendLine();

        sb.appendLine("@end");
        sb.appendLine();
        sb.appendLine();

        // properties format assignment
        sb.appendLine("@implementation " + codeOCClass.name + "Format");
        sb.appendLine();
        sb.appendLine("- (void)confirmAll");
        sb.appendLine("{");
        sb.appendLine();

        codeOCClass.properties.forEach((p) => {
            if (p.name.indexOf("Id") > -1) {
                sb.appendLine(indent1 + "self." + camelNaming(codeOCClass.name) + "Id = YES;");
            } else {
                sb.appendLine(indent1 + "self." + camelNaming(p.name) + " = YES;");
            }
        });

        sb.appendLine("}")
        sb.appendLine();

        sb.appendLine("@end");

        return sb.toString();
    }
}

class CodeJava implements IBuildCode {
    buildCode(pseudoCode: PseudoCode): string {
        var sb = new StringBuilder();

        var builtinTypes = ["int", "long", "short", "guid", "bool", "float", "double", "byte", "char", "string", "datetime", "timespan", "decimal"];

        function isBuiltinType(typeName: string): boolean {
            var typeName = typeName.toLowerCase();
            return builtinTypes.indexOf(typeName) >= 0;
        }

        var enumNames: string[] = [];
        pseudoCode.enums.forEach((e) => {
            enumNames.push(e.name.toLowerCase());
        });

        function isEnum(typeName: string): boolean {
            var typeName = typeName.toLowerCase();
            return enumNames.indexOf(typeName) >= 0;
        }

        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;

        sb.appendLine("import android.common.Guid;");
        sb.appendLine("import android.common.json.JsonUtility;");
        sb.appendLine("import android.common.json.JsonWriter;");
        sb.appendLine("import android.os.Parcel;");
        sb.appendLine("import android.os.Parcelable;");
        sb.appendLine("import org.json.JSONArray;");
        sb.appendLine("import org.json.JSONObject;");
        sb.appendLine("import java.util.ArrayList;");
        sb.appendLine("import java.util.Date;");
        sb.appendLine("import java.util.List;");

        sb.appendLine();
        sb.appendLine();

        var codeJavaClass = pseudoCode.codeClass;
        sb.appendLine("public class " + codeJavaClass.name + " implements Parcelable {");

        sb.appendLine();
        codeJavaClass.properties.forEach((p) => {
            if (p.type.indexOf("string") > -1) {
                sb.appendLine(indent1 + "private String " + p.name + ";");
            }
            sb.appendLine(indent1 + "private " + p.type + " " + p.name + ";");
        });
        sb.appendLine();

        sb.appendLine(indent1 + "public " + codeJavaClass.name + "() {");
        sb.appendLine(indent1 + "}");
        sb.appendLine();

        sb.appendLine(indent1 + "public class Format {");
        codeJavaClass.properties.forEach((p) => {
            if (p.isList) {
                sb.appendLine(indent2 + "public " + codeJavaClass.name + ".Format " + p.name);
            } else if (isBuiltinType(p.type) || isEnum(p.type)) {
                sb.appendLine(indent2 + "public boolean " + p.name + ";");
            } else {
                sb.appendLine(indent2 + "public " + p.type + ".Format " + p.name);
            }
        });
        sb.appendLine("}");

        sb.appendLine();
        sb.appendLine(indent1 + "public " + codeJavaClass.name + "(Parcel in) {");
        codeJavaClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid": sb.appendLine(indent2 + p.name + " = (Guid)in.readSerializeable();"); break;
                    case "int": sb.appendLine(indent2 + p.name + " = in.readInt()"); break;
                    case "long": sb.appendLine(indent2 + p.name + " = in.readLong();"); break;
                    case "float": sb.appendLine(indent2 + p.name + " = in.readFloat();"); break;
                    case "double": sb.appendLine(indent2 + p.name + " = in.readDouble();"); break;
                    case "string": sb.appendLine(indent2 + p.name + " = in.readString();"); break;
                    case "boolean":
                    case "bool": sb.appendLine(indent2 + p.name + " = in.readInt() == 0 ? false : true;"); break;
                    case "date":
                    case "timespan":
                    case "datetime": sb.appendLine(indent2 + p.name + " = (Date)in.readSerializeable();"); break;
                }
            } else if (isEnum(p.type)) {
                sb.appendLine(indent2 + p.name + " = " + p.name + ".ValueOf(in.readInt());");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + p.name + " = new ArrayList<>();");
                sb.appendLine(indent2 + "in.readTypedList(" + p.name + ", " + codeJavaClass.name + ".CREATOR" + ");");
            } else {
                sb.appendLine(indent2 + "in.readParcelable" + "(" + p.type + ".class.getClassLoader());")
            }

        });

        sb.appendLine(indent1 + "}");
        sb.appendLine();

        // @Override
        // writeToParcel
        sb.appendLine(indent1 + "@Override");
        sb.appendLine(indent1 + "public void writeToParcel(Parcel parcel, int flag) {");
        codeJavaClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid": sb.appendLine(indent2 + "parcel.writeSerializeable(" + p.name + ");"); break;
                    case "int": sb.appendLine(indent2 + "parcel.writeInt(" + p.name + ");"); break;
                    case "long": sb.appendLine(indent2 + "parcel.writeLong(" + p.name + ");"); break;
                    case "float": sb.appendLine(indent2 + "parcel.writeFloat(" + p.name + ");"); break;
                    case "double": sb.appendLine(indent2 + "parcel.writeDouble(" + p.name + ");"); break;
                    case "string": sb.appendLine(indent2 + "parcel.writeString(" + p.name + ");"); break;
                    case "boolean":
                    case "bool": sb.appendLine(indent2 + "parcel.writeInt(" + p.name + " ? 0 : 1);"); break;
                    case "date":
                    case "timespan":
                    case "datetime": sb.appendLine(indent2 + "parcel.writeSerializeable(" + p.name + ");"); break;
                    default:
                        break;
                }
            } else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "parcel.writeInt(" + p.name + ".value());");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "parcel.writeTypedList(" + p.name + ");");
            } else {
                sb.appendLine(indent2 + "parcel.writeParcelable(" + p.type + ", flag);");
            }
        });
        sb.appendLine(indent1 + "}")

        // serializeObject
        sb.appendLine();
        sb.appendLine(indent1 + "public static void serializeObject(JsonWriter writer," + codeJavaClass.name + " entity, Format format) {");
        sb.appendLine(indent2 + "writer.beginObject()");
        codeJavaClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value((entity." + p.name + " == null) ? Guid.empty : entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "long":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "float":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "double":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity.)" + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(JsonUtility.DateToString(entity." + p.name + "));");
                        sb.appendLine(indent2 + "}");
                        break;
                    default:
                        break;
                }
            } else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if (format." + p.name + ") {");
                sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ".value());");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((format." + p.name + " != null) && (entity." + p.name + " != null)) {");
                sb.appendLine(indent3 + "write.name(\"" + p.name + "\");");
                sb.appendLine(indent3 + codeJavaClass.name + ".serializeArray(writer, entity.)" + p.name + ", format." + p.name + ");");
                sb.appendLine(indent2 + "}");
            } else {
                sb.appendLine(indent2 + "if ((format." + p.type + " != null) && (entity." + p.type + " != null)) {");
                sb.appendLine(indent3 + "writer.name(\"" + p.type + "\"");
                sb.appendLine(indent3 + codeJavaClass.name + ".serializeObject(writer, entity." + p.name + ", format." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }

        });

        sb.appendLine(indent2 + "writer.beginObject()");
        sb.appendLine(indent1 + "}");

        // deserializeObject
        sb.appendLine();
        sb.appendLine(indent1 + "public static " + codeJavaClass.name + " deserializeObject(JSONObject json) {");
        sb.appendLine(indent2 + codeJavaClass.name + " entity = new " + codeJavaClass.name + "()");
        sb.appendLine();
        codeJavaClass.properties.forEach((p) => {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid": sb.appendLine(indent2 + "entity." + p.name + " = JsonUtility(json, \"" + p.name + "\")"); break;
                    case "int": sb.appendLine(indent2 + "entity." + p.name + " = json.optInt(\"" + p.name + "\");"); break;
                    case "long": sb.appendLine(indent2 + "entity." + p.name + " = json.optInt(\"" + p.name + "\");"); break;
                    case "float": sb.appendLine(indent2 + "entity." + p.name + " = json.optInt(\"" + p.name + "\");"); break;
                    case "double": sb.appendLine(indent2 + "entity." + p.name + " = json.optDouble(\"" + p.name + "\");"); break;
                    case "string": sb.appendLine(indent2 + "entity." + p.name + " = json.optString(\"" + p.name + "\");"); break;
                    case "boolean":
                    case "bool": sb.appendLine(indent2 + "entity." + p.name + " = json.optBoolean(\"" + p.name + "\");"); break;
                    case "date":
                    case "timespan":
                    case "datetime": sb.appendLine(indent2 + "entity." + p.name + " = JsonUtility.optDate(json, \"" + p.name + "\");"); break;
                    default:
                        break;
                }
            } else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if (json.has(\"" + p.name + "\")) {");
                sb.appendLine(indent3 + "entity." + p.name + " = " + p.type + ".valueOf(json.optInt(\"" + p.name + "\"));");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if (json.has(\"" + p.name + "\")) {");
                sb.appendLine(indent3 + "entity." + p.name + " = " + codeJavaClass.name + " deserializeArray(json.optJSONArray(\"" + p.name + "\"));");
                sb.appendLine(indent2 + "}");
            } else {
                sb.appendLine(indent2 + "if (json.has(\"" + p.name + "\")) {");
                sb.appendLine(indent3 + "entity." + p.name + " = " + p.type + "deserializeObject(json.optJSONObject(\"" + p.name + "\"));");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine();
        sb.appendLine(indent2 + "return entity;");
        sb.appendLine(indent1 + "}");


        // serializeArray
        sb.appendLine();
        sb.appendLine(indent1 + "public static void serializeArray(JsonWriter writer, List<" + codeJavaClass.name + "> entity) {");
        sb.appendLine(indent2 + "writer.beginArray();");
        sb.appendLine(indent2 + "for (" + codeJavaClass.name + " item : list) {");
        sb.appendLine(indent3 + "serializeObject(writer, item, format);");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "writer.endArray();");
        sb.appendLine(indent1 + "}");

        // deserializeArray
        sb.appendLine();
        sb.appendLine(indent1 + "public static List<" + codeJavaClass.name + "> deserializeArray(JSONArray jsonArray) {");
        sb.appendLine(indent2 + "List<" + codeJavaClass.name + "> list = new ArrayList<>();");
        sb.appendLine(indent2 + "for (int i = 0; i < jsonArray.length(); i++) {");
        sb.appendLine(indent3 + "JSONObject json = jsonArray.optJSONObject(i);");
        sb.appendLine(indent3 + "list.add(deserializeObject(json));")
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "return list;");
        sb.appendLine(indent1 + "}");

        sb.appendLine();
        sb.appendLine(indent1 + "public static final Creator<" + codeJavaClass.name + "> CREATOR = new Creator<" + codeJavaClass.name + ">() {");
        sb.appendLine(indent2 + "@override");
        sb.appendLine(indent2 + "public " + codeJavaClass.name + " createFromParcel(Parcel in) {");
        sb.appendLine(indent3 + "return new " + codeJavaClass.name + "(in)");
        sb.appendLine(indent2 + "}");
        sb.appendLine();
        sb.appendLine(indent2 + "@override");
        sb.appendLine(indent2 + "public " + codeJavaClass.name + "[] newArray(int size) {");
        sb.appendLine(indent3 + "return new " + codeJavaClass.name + "[size];");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent1 + "}");

        sb.appendLine();
        sb.appendLine(indent1 + "@override");
        sb.appendLine(indent1 + "public int describeContents() {");
        sb.appendLine(indent2 + "return 0;");
        sb.appendLine(indent1 + "}");

        sb.appendLine("}");
        return sb.toString();
    }
}

class CodeTypeScript implements IBuildCode {
    private static builtinTypes = ["int", "long", "short", "guid", "bool", "float", "double", "byte", "char", "string", "datetime", "timespan", "decimal"];
    private enumNames: string[] = [];

    private static isBuiltinType(typeName: string): boolean {
        return CodeTypeScript.builtinTypes.indexOf(typeName.toLowerCase()) >= 0;
    }

    private isEnum(typeName: string): boolean {
        var typeName = typeName.toLowerCase();
        return this.enumNames.indexOf(typeName) >= 0;
    }

    buildCode(pseudoCode: PseudoCode): string {
        pseudoCode.enums.forEach((e) => {
            this.enumNames.push(e.name.toLowerCase());
        });

        let sb = new StringBuilder();

        if (!String.isNullOrEmpty(pseudoCode.codeClass.name)) {
            this.buildCodeClass(pseudoCode, sb);
        }
        else {
            this.buildCodeInvokeItem(pseudoCode, sb);
        }

        return sb.toString();
    }

    private buildCodeClass(pseudoCode: PseudoCode, sb: StringBuilder) {
        let indent1 = "    ";
        let indent2 = indent1 + indent1;
        let indent3 = indent2 + indent1;

        let codeTsClass = pseudoCode.codeClass;

        let enumNames: string[] = [];
        pseudoCode.enums.forEach((e) => {
            enumNames.push(e.name.toLowerCase());
        });

        function isEnum(typeName: string): boolean {
            var typeName = typeName.toLowerCase();
            return enumNames.indexOf(typeName) >= 0;
        }

        sb.appendLine("export class " + codeTsClass.name + " {");

        codeTsClass.properties.forEach((p) => {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Guid = Guid.empty;");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": number = 0;");
                        break;
                    case "string":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": string = \"\";");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Date = Date.empty;");
                        break;
                }
            } else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.type + " = " + p.type + ".Default;");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Array<" + p.listItemType + "> = null;");
            } else {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.type + " = null;");
            }
        });

        sb.appendLine();
        sb.appendLine(indent1 + "public static serializeEntity(writer: JsonWriter, entity: " + codeTsClass.name + ", format: " + codeTsClass.name + "Format): void {");
        sb.appendLine(indent2 + "writer.writeStartObject();");
        codeTsClass.properties.forEach((p) => {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                }
            } else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((format." + camelNaming(p.name) + ") && (entity." + camelNaming(p.name) + ")) {");
                sb.appendLine(indent3 + "writer.writeName(\"" + p.name + "\");");
                sb.appendLine(indent3 + p.listItemType + ".serializeEntities(writer, entity." + camelNaming(p.name) + ", format." + camelNaming(p.name) + ");");
                sb.appendLine(indent2 + "}");
            } else {
                sb.appendLine(indent2 + "if ((format." + camelNaming(p.name) + ") && (entity." + camelNaming(p.name) + ")) {");
                sb.appendLine(indent3 + "writer.writeName(\"" + p.name + "\");");
                sb.appendLine(indent3 + p.name + ".serializeEntity(writer, entity." + camelNaming(p.name) + ", format." + camelNaming(p.name) + ");");
                sb.appendLine(indent2 + "}");
            }
        });

        sb.appendLine(indent2 + " writer.writeEndObject();");
        sb.appendLine(indent1 + "}");
        sb.appendLine();

        //serializeEntities
        sb.appendLine(indent1 + "public static serializeEntities(writer: JsonWriter, entities: Array<" + codeTsClass.name + ">, format: " + codeTsClass.name + "Format): void {");
        sb.appendLine(indent2 + "writer.writeStartArray();");
        sb.appendLine(indent2 + "entities.forEach(entity => {");
        sb.appendLine(indent3 + codeTsClass.name + ".serializeEntity(writer, entity, format);");
        sb.appendLine(indent2 + "});");
        sb.appendLine(indent2 + "writer.writeEndArray();");
        sb.appendLine(indent1 + "}");

        // deserializeEntity
        sb.appendLine();
        sb.appendLine(indent1 + "public static deserializeEntity(jsonObject: any): " + codeTsClass.name + " {");
        sb.appendLine(indent2 + "let entity = new " + codeTsClass.name + "();");
        codeTsClass.properties.forEach((p) => {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = Guid.parse(jsonObject." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = new Date(Date.parse(jsonObject." + p.name + "));");
                        sb.appendLine(indent2 + "}");
                        break;
                }
            } else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = <" + p.type + ">(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntities(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            } else {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntity(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine(indent2 + "return entity;");
        sb.appendLine(indent1 + "}");

        // deserializeEntities
        sb.appendLine();
        sb.appendLine(indent1 + "public static deserializeEntities(jsonArray: any[]): Array<" + codeTsClass.name + "> {");
        sb.appendLine(indent2 + "let entities = new Array<" + codeTsClass.name + ">();");
        sb.appendLine(indent2 + "let count = jsonArray.length;");
        sb.appendLine(indent2 + "for (let i = 0; i < count; i++) {");
        sb.appendLine(indent3 + "let entity = " + codeTsClass.name + ".deserializeEntity(jsonArray[i]);");
        sb.appendLine(indent3 + "entities.push(entity);");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "return entities;");
        sb.appendLine(indent1 + "}");

        sb.appendLine("}");

        sb.appendLine();
        sb.appendLine("export class " + codeTsClass.name + "Format {");
        codeTsClass.properties.forEach((p) => {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
            } else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
            } else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.typeWithoutList + "Format = null;");
            } else {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.typeWithoutList + "Format = null;");
            }
        });

        sb.appendLine("}");
    }

    private buildCodeInvokeItem(pseudoCode: PseudoCode, sb: StringBuilder) {
        let indent1 = "    ";
        let indent2 = indent1 + indent1;
        let indent3 = indent2 + indent1;

        let invokeItem = pseudoCode.codeInvokeItem;

        sb.appendLine("export class " + invokeItem.name + "InvokeItem extends BaseInvokeItem {");
        sb.appendLine(indent1 + "public result: " + invokeItem.name + "InvokeItemResult = null;");

        // constructor
        sb.append(indent1 + "public constructor(");
        let allUrlParts: Array<CodeUrlPart> = [];
        allUrlParts.pushRange(invokeItem.urlPath);
        allUrlParts.pushRange(invokeItem.urlQueryString);

        let isFirstParameterPart = true;
        allUrlParts.forEach((part) => {
            if (part instanceof CodeUrlPlain) {
                return;
            }

            if (!isFirstParameterPart) {
                sb.append(", ");
            }
            else {
                isFirstParameterPart = false;
            }

            let p = part as CodeUrlParameter;
            let definition = this.buildDefinition(p.type, p.name);
            sb.append(definition);
        });
        invokeItem.requestBody.forEach((p) => {
            if (!isFirstParameterPart) {
                sb.append(", ");
            }
            else {
                isFirstParameterPart = false;
            }

            let definition = this.buildDefinition(p.type, camelNaming(p.name));
            sb.append(definition);

            if ((!CodeTypeScript.isBuiltinType(p.type)) && (!this.isEnum(p.type))) {
                sb.append(", ");
                sb.append(camelNaming(p.name) + "Format: " + p.typeWithoutList + "Format");
            }
        });
        sb.appendLine(") {");
        sb.appendLine(indent2 + "super();");
        sb.appendLine(indent2 + "this.method = \"" + invokeItem.method + "\";");
        sb.appendLine(indent2 + "this.needAccessToken = " + (invokeItem.needAccessToken ? "true" : "false") + ";");
        sb.append(indent2 + "this.relativeUrl = `");
        invokeItem.urlPath.forEach((part) => {
            if (part instanceof CodeUrlPlain) {
                sb.append((part as CodeUrlPlain).plainUrl);
                return;
            }
            sb.append("${");
            let p = part as CodeUrlParameter;
            sb.append(this.buildToString(p.type, p.name));
            sb.append("}");
        });
        sb.append("?");
        invokeItem.urlQueryString.forEach((part) => {
            if (part instanceof CodeUrlPlain) {
                sb.append((part as CodeUrlPlain).plainUrl);
                return;
            }
            sb.append("${");
            let p = part as CodeUrlParameter;
            sb.append(this.buildToString(p.type, p.name));
            sb.append("}");
        });
        sb.appendLine("`;");

        if (invokeItem.requestBody.length > 0) {
            sb.appendLine();
            sb.appendLine(indent2 + "let writer = new JsonWriter();");
            sb.appendLine(indent2 + "writer.writeStartObject();");
            invokeItem.requestBody.forEach((p) => {
                let name = p.name;
                let camelName = camelNaming(name);
                if (CodeTypeScript.isBuiltinType(p.type)) {
                    switch (p.type.toLocaleLowerCase()) {
                        case "guid":
                        case "int":
                        case "long":
                        case "float":
                        case "double":
                        case "string":
                        case "boolean":
                        case "bool":
                        case "date":
                        case "timespan":
                        case "datetime":
                            sb.appendLine(indent2 + "writer.write(\"" + name + "\", " + camelName + ");");
                            break;
                    }
                } else if (this.isEnum(p.type)) {
                    sb.appendLine(indent2 + "writer.write(\"" + name + "\", " + camelName + ");");
                }
                else if (p.type.indexOf("List") > -1) {
                    sb.appendLine(indent2 + "writer.writeName(\"" + name + "\");");
                    sb.appendLine(indent2 + p.listItemType + ".serializeEntities(writer, " + camelName + ", " + camelName + "Format);");
                } else {
                    sb.appendLine(indent2 + "writer.writeName(\"" + name + "\");");
                    sb.appendLine(indent2 + name + ".serializeEntity(writer, " + camelName + ", " + camelName + "Format);");
                }
            });
            sb.appendLine(indent2 + "writer.writeEndObject();");
            sb.appendLine(indent2 + "this.requestBodyJson = writer.toString();");
        }

        sb.appendLine(indent1 + "}");
        sb.appendLine();

        sb.appendLine(indent1 + "public postInvoke(code: number): void {");
        sb.appendLine(indent2 + "if (code < 0) {");
        sb.appendLine(indent3 + "return;");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "this.result = " + invokeItem.name + "InvokeItemResult.deserialize(this.responseBodyJson);");
        sb.appendLine(indent1 + "}");

        sb.appendLine("}");

        sb.appendLine();
        this.buildCodeInvokeItemResultClass(pseudoCode, sb);
    }

    private buildCodeInvokeItemResultClass(pseudoCode: PseudoCode, sb: StringBuilder) {
        let indent1 = "    ";
        let indent2 = indent1 + indent1;
        let indent3 = indent2 + indent1;

        let codeInvokeItem = pseudoCode.codeInvokeItem;
        let resultClassName = codeInvokeItem.name + "InvokeItemResult";

        sb.appendLine("export class " + resultClassName + " extends BaseInvokeItemResult {");

        codeInvokeItem.responseBody.forEach((p) => {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Guid = Guid.empty;");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": number = 0;");
                        break;
                    case "string":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": string = \"\";");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Date = Date.empty;");
                        break;
                }
            } else if (this.isEnum(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.type + " = " + p.type + ".Default;");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Array<" + p.listItemType + "> = null;");
            } else {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.listItemType + " = null;");
            }
        });

        sb.appendLine();

        // deserializeEntity
        sb.appendLine();
        sb.appendLine(indent1 + "public static deserialize(jsonObject: any): " + resultClassName + " {");
        sb.appendLine(indent2 + "let entity = new " + resultClassName + "();");
        sb.appendLine(indent2 + "entity.deserializeBasicInfo(jsonObject);");
        codeInvokeItem.responseBody.forEach((p) => {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = Guid.parse(jsonObject." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = new Date(Date.parse(jsonObject." + p.name + "));");
                        sb.appendLine(indent2 + "}");
                        break;
                }
            } else if (this.isEnum(p.type)) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = <" + p.type + ">(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntities(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            } else {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntity(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine(indent2 + "return entity;");
        sb.appendLine(indent1 + "}");

        sb.appendLine("}");
    }


    private buildDefinition(type: string, name: string): string {
        let t: string = "Unsupported";
        if (CodeTypeScript.isBuiltinType(type)) {
            switch (type.toLocaleLowerCase()) {
                case "guid":
                    t = "Guid";
                    break;
                case "int":
                case "long":
                case "float":
                case "double":
                    t = "number";
                    break;
                case "string":
                    t = "string";
                    break;
                case "boolean":
                case "bool":
                    t = "boolean";
                    break;
                case "date":
                case "timespan":
                case "datetime":
                    t = "Date";
                    break;
            }
        } else if (this.isEnum(type)) {
            t = type;
        }
        else {
            // Customized classes
            t = type;
        }
        return (name + ": " + t);
    }

    private buildToString(type: string, name: string): string {
        if (CodeTypeScript.isBuiltinType(type)) {
            switch (type.toLocaleLowerCase()) {
                case "boolean":
                case "bool":
                    return "(" + name + " ? \"1\" : \"0\")";
                case "date":
                case "timespan":
                case "datetime":
                    return name + ".toString(\"YYYY-MM-DD HH:mm:ss\")";
                default:
                    return name;
            }
        } else if (this.isEnum(type)) {
            return name;
        }
    }
}

