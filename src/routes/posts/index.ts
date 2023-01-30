// @ts-nocheck
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return reply.send(this.db.posts.findMany());
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { params: { id } } = request;

      try {
        const post = await this.db.posts.findOne({ key: 'id', equals: id });

        if (!post) {
          return reply.status(404).send({ status: 404, message: 'Post is not found' });
        }

        return reply.status(200).send(post);

      } catch {
        return reply.status(404).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { body } = request;

      try {
        const post = await this.db.posts.create(body);
        return reply.status(200).send(post);
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
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;

      try {
        const post = await this.db.posts.findOne({ key: 'id', equals: id });

        if (!post) {
          return reply.status(400).send({ status: 400, message: 'Post is not found' });
        }

        if (!id) {
          return reply.status(400).send({ status: 400, message: 'Invalid id' });
        }

        const deletedPost = await this.db.posts.delete(id);

        return reply.status(200).send(deletedPost);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { body, params: { id } } = request;

      try {
        const post = await this.db.posts.change(id, body);

        return reply.status(200).send(post);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );
};

export default plugin;
