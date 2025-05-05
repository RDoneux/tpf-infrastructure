import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

  const config = new pulumi.Config();

  const projectName = config.require("projectname");
  const serviceName = config.require("servicename");

  const resourcePrefix = `${projectName}-${serviceName}`;

  const securityGroup = new aws.ec2.SecurityGroup(`${resourcePrefix}-sg`, {
    description: "Allow HTTP and HTTPS traffic",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    egress: [
      {
        protocol: "tcp",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
  });

  const auroraCluster = new aws.rds.Cluster(
    `${resourcePrefix}-aurora-cluster`,
    {
      engine: aws.rds.EngineType.AuroraPostgresql,
      engineMode: aws.rds.EngineMode.Provisioned,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0,
        maxCapacity: 1,
        secondsUntilAutoPause: 300,
      },
      masterUsername: "postgres",
      masterPassword: "postgres",
      skipFinalSnapshot: true,
      vpcSecurityGroupIds: [securityGroup.id],
    }
  );

  new aws.rds.ClusterInstance(`${resourcePrefix}-instance`, {
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.serverless",
    engine: auroraCluster.engine.apply(
      (engine) => engine as aws.rds.EngineType
    ),
    engineVersion: auroraCluster.engineVersion,
    publiclyAccessible: true,
  });


    export const port = auroraCluster.port
    export const endpoint = auroraCluster.endpoint
    export const dbUser = auroraCluster.masterUsername
    export const dbPassword = auroraCluster.masterPassword
