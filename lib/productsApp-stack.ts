//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html
import * as lambda from "aws-cdk-lib/aws-lambda"

//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs"

//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html
import * as cdk from "aws-cdk-lib"
import * as dynadb from "aws-cdk-lib/aws-dynamodb"

import { Construct } from "constructs"

export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJS.NodejsFunction
  readonly productsAdminHandler: lambdaNodeJS.NodejsFunction
  readonly productsDdb: dynadb.Table

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.productsDdb = new dynadb.Table(this, "ProductsDdb", {
      tableName: "products",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // o padrão é não excluir pois dados armazenados não sao excluido juntos com a stack
      partitionKey: {
        name: "id",
        type: dynadb.AttributeType.STRING
      },
      billingMode: dynadb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    })

    this.productsFetchHandler = new lambdaNodeJS.NodejsFunction(this,
      "ProductsFetchFunction", {
      functionName: "ProductsFetchFunction",
      entry: "lambda/products/productsFetchFunction.ts",
      handler: "handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        PRODUCTS_DDB: this.productsDdb.tableName
      },
      runtime: lambda.Runtime.NODEJS_20_X
    })

    this.productsDdb.grantReadData(this.productsFetchHandler)

    this.productsAdminHandler = new lambdaNodeJS.NodejsFunction(this,
      "ProductsAdminFunction", {
      functionName: "ProductsAdminFunction",
      entry: "lambda/products/productsAdminFunction.ts",
      handler: "handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        PRODUCTS_DDB: this.productsDdb.tableName
      },
      runtime: lambda.Runtime.NODEJS_20_X
    })

    this.productsDdb.grantWriteData(this.productsAdminHandler)
  }
}