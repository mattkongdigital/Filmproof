import { SiloIndex } from '../../components/editorial';
import { siloMetadata } from '../../lib/posts';

export const generateMetadata = () => siloMetadata('field-notes');

export default function Page() {
  return <SiloIndex silo="field-notes" />;
}
