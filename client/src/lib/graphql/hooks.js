import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  addMessageMutation,
  messageAddedSubscription,
  messagesQuery,
} from "./queries";

export function useAddMessage() {
  const [mutate] = useMutation(addMessageMutation);

  const addMessage = async (text) => {
    const {
      data: { message },
    } = await mutate({
      variables: { text },
      // update: (cache, { data }) => {
      //   // data is object that is returned base on the schema of mutate (it is return the message that is added, not all messages)
      //   const newMessage = data.message;
      //   cache.updateQuery({ query: messagesQuery }, (oldData) => {
      //     // oldData is data that is returned by query
      //     return { messages: [...oldData.messages, newMessage] };
      //   });
      // },
    });
    return message;
  };

  return { addMessage };
}

export function useMessages() {
  const { data } = useQuery(messagesQuery);
  useSubscription(messageAddedSubscription, {
    onData: ({ client, data }) => {
      const newMessage = data.data.message;
      client.cache.updateQuery({ query: messagesQuery }, (oldData) => {
        // oldData is data that is returned by query
        return { messages: [...oldData.messages, newMessage] };
      });
    },
  });

  return {
    messages: data?.messages ?? [],
  };
}
