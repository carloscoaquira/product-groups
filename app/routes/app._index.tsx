import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getProductGroups } from "../models/ProductGroup.server";
import { useLoaderData } from "react-router";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const groups = await getProductGroups(session.shop);

  return { groups };
}

const EmptyProductGroupState = () => (
  <s-section accessibilityLabel="Empty product groups">
    <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
      <s-box maxInlineSize="200px" maxBlockSize="200px">
        <s-image
          aspectRatio="1/0.5"
          src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          alt="Empty state"
        />
      </s-box>

      <s-grid justifyItems="center" maxInlineSize="450px">
        <s-heading>Create product groups</s-heading>
        <s-paragraph>
          Group products together to reuse them across your app.
        </s-paragraph>

        <s-stack direction="inline" gap="small-200">
          <s-button href="/app/productgroups/new" variant="primary">
            Create group
          </s-button>
        </s-stack>
      </s-grid>
    </s-grid>
  </s-section>
);

const ProductGroupTable = ({ groups }) => (
  <s-section padding="none" accessibilityLabel="Product groups table">
    <s-table>
      <s-table-header-row>
        <s-table-header listSlot="primary">Title</s-table-header>
        <s-table-header>Date created</s-table-header>
      </s-table-header-row>

      <s-table-body>
        {groups.map((group) => (
          <ProductGroupRow key={group.id} group={group} />
        ))}
      </s-table-body>
    </s-table>
  </s-section>
);

const ProductGroupRow = ({ group }) => (
  <s-table-row id={group.id} position={group.id}>
    <s-table-cell>
      <s-link href={`/app/productgroups/${group.id}`}>
        {group.title}
      </s-link>
    </s-table-cell>

    <s-table-cell>
      {new Date(group.createdAt).toDateString()}
    </s-table-cell>
  </s-table-row>
);

export default function Index() {
  const { groups } = useLoaderData();

  return (
    <s-page heading="Product groups">
      <s-link slot="secondary-actions" href="/app/productgroups/new">
        Create group
      </s-link>

      {groups.length === 0 ? (
        <EmptyProductGroupState />
      ) : (
        <ProductGroupTable groups={groups} />
      )}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

