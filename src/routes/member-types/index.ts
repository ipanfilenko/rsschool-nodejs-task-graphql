import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return reply.send(this.db.memberTypes.findMany());
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { params: { id } } = request;

      try {
        const memberType = await this.db.memberTypes.findOne({ key: 'id', equals: id });

        if (!memberType) {
          return reply.status(404).send({ status: 404, message: 'MemberType is not found' });
        }

        return reply.status(200).send(memberType);

      } catch {
        return reply.status(404).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { body, params: { id } } = request;

      try {
        const memberType = await this.db.memberTypes.findOne({ key: 'id', equals: id });

        if (!memberType) {
          return reply.status(400).send({ status: 404, message: 'MemberType is not found' });
        }

        const updatedMemberType = await this.db.memberTypes.change(id, body);

        return reply.status(200).send(updatedMemberType);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );
};

export default plugin;
