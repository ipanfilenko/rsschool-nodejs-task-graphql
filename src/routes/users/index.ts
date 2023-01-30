// @ts-nocheck
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return reply.send(this.db.users.findMany());
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      try {
        const user = await this.db.users.findOne({ key: 'id', equals: id });

        if (!user) {
          return reply.status(404).send({ status: 404, message: 'User is not found' });
        }

        return reply.status(200).send(user);

      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { body } = request;

      try {
        const user = await this.db.users.create(body);
        return reply.status(200).send(user);
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
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      try {
        const user = await this.db.users.findOne({ key: 'id', equals: id });

        if (!user) {
          return reply.status(400).send({ status: 400, message: 'User is not found' });
        }

        if (!id) {
          return reply.status(400).send({ status: 400, message: 'Invalid user id' });
        }

        const deletedUser = await this.db.users.delete(id);

        const profile = await this.db.profiles.findOne({ key: 'userId', equals: deletedUser.id })

        if (profile) {
          await this.db.profiles.delete(profile.id);
        }

        const posts = await this.db.posts.findMany({ key: 'userId', equals: deletedUser.id });

        posts.forEach(async (post) => await this.db.posts.delete(post.id));

        const allUsers = await this.db.users.findMany();

        allUsers.forEach(async (user) => {
          if(user.subscribedToUserIds.includes(deletedUser.id)) {
            const newSubscriptions = user.subscribedToUserIds.filter((_id) => _id !== deletedUser.id);
            const updatedUser = { ...user, subscribedToUserIds: newSubscriptions };
            await this.db.users.change(user.id, updatedUser);
          }
        });

        return reply.status(200).send(deletedUser);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { body: { userId }, params: { id } } = request;

      try {
        const subscriber = await this.db.users.findOne({ key: 'id', equals: id });
        const user = await this.db.users.findOne({ key: 'id', equals: userId });

        if (!subscriber || !user) {
          return reply.status(404).send({ status: 404, message: 'User is not found' });
        }

        const newSubscriptions = [...user.subscribedToUserIds, subscriber.id];
        const updatedUser = { ...user, subscribedToUserIds: newSubscriptions };
        
        this.db.users.change(userId, updatedUser);

        return reply.status(200).send(updatedUser);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { body: { userId }, params: { id } } = request;

      try {
        const subscriber = await this.db.users.findOne({ key: 'id', equals: id });
        const user = await this.db.users.findOne({ key: 'id', equals: userId });

        if (!subscriber || !user) {
          return reply.status(404).send({ status: 404, message: 'User is not found' });
        }

        if (!user.subscribedToUserIds.includes(id)) {
          return reply.status(400).send({ status: 400, message: 'User is not found in subscriptions' });
        }

        const newSubscriptions = [...user.subscribedToUserIds.filter(_id => _id !== id)]; // delete user id from subscriptions
        const updatedUser = { ...user, subscribedToUserIds: newSubscriptions };
        
        this.db.users.change(userId, updatedUser);

        return reply.status(200).send(updatedUser);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { body, params: { id } } = request;

      try {
        const user = await this.db.users.findOne({ key: 'id', equals: id });

        if (!user) {
          return reply.status(400).send({ status: 404, message: 'User is not found' });
        }

        const updatedUser = await this.db.users.change(id, body);

        return reply.status(200).send(updatedUser);
      } catch {
        return reply.status(400).send({ status: 400, message: 'Internel server error' });
      }
    }
  );
};

export default plugin;
