// @ts-nocheck
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return reply.send(this.db.profiles.findMany());
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { params: { id } } = request;

      try {
        const profile = await this.db.profiles.findOne({ key: 'id', equals: id });

        if (!profile) {
          return reply.status(404).send({ status: 404, message: 'Profile is not found' });
        }

        return reply.status(200).send(profile);

      } catch {
        return reply.status(404).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { body } = request;

      try {
        const user = await this.db.users.findOne({ key: 'id', equals: body.userId });

        if (!user) { 
          return reply.status(400).send({ status: 400, message: 'Internel server error' });
        }

        const memberType = await this.db.memberTypes.findOne({ key: 'id', equals: body.memberTypeId });

        if (!memberType) {
          return reply.status(400).send({ status: 400, message: 'Internel server error' });
        }

 
        const existingProfile = await this.db.profiles.findOne({ key: 'userId', equals: body.userId });

        if (existingProfile) { // user already has profile
          return reply.status(400).send({ status: 400, message: 'Internel server error' });
        }

        const profile = await this.db.profiles.create(body);

        return reply.status(200).send(profile);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;

      try {
        const profile = await this.db.profiles.findOne({ key: 'id', equals: id });

        if (!profile) {
          return reply.status(400).send({ status: 400, message: 'Post is not found' });
        }

        if (!id) {
          return reply.status(400).send({ status: 400, message: 'Invalid id' });
        }

        const deletedProfile= await this.db.profiles.delete(id);

        return reply.status(200).send(deletedProfile);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { body, params: { id } } = request;

      try {
        const profile = await this.db.profiles.findOne({ key: 'id', equals: id  });

        if (!profile) {
          return reply.status(400).send({ status: 404, message: 'Profile is not found' });
        }

        const updatedProfile = await this.db.profiles.change(id , body);

        return reply.status(200).send(updatedProfile);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );
};

export default plugin;
