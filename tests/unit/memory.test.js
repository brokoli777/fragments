const {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
} = require('../../src/model/data/memory/index');

describe('Fragment Data Management', () => {

  test('should write and read fragment metadata', async () => {
    const fragment = { ownerId: 'user1', id: 'fraggy1', data: 'test' };
    await writeFragment(fragment);
    const readData = await readFragment('user1', 'fraggy1');
    expect(readData).toEqual(fragment);
  });

  test('should write and read fragment data', async () => {
    const buffer = Buffer.from('test data');
    await writeFragmentData('user1', 'fraggy1', buffer);
    const readData = await readFragmentData('user1', 'fraggy1');
    expect(readData).toEqual(buffer);
  });

  test('should list fragments for a user', async () => {
    const fragment1 = { ownerId: 'user1', id: 'fraggy1', data: 'test1' };
    const fragment2 = { ownerId: 'user1', id: 'frag2', data: 'test2' };
    await writeFragment(fragment1);
    await writeFragment(fragment2);
    const fragments = await listFragments('user1');
    expect(fragments).toEqual(['fraggy1', 'frag2']);
  });

  test('should list expanded fragments for a user', async () => {
    const fragment1 = { ownerId: 'user1', id: 'fraggy1', data: 'test1' };
    const fragment2 = { ownerId: 'user1', id: 'frag2', data: 'test2' };
    await writeFragment(fragment1);
    await writeFragment(fragment2);
    const fragments = await listFragments('user1', true);
    expect(fragments).toEqual([fragment1, fragment2]);
  });

  test('should delete a fragment', async () => {
    const fragment = { ownerId: 'user1', id: 'fraggy1', data: 'test' };
    await writeFragment(fragment);
    await writeFragmentData('user1', 'fraggy1', Buffer.from('test data'));
    await deleteFragment('user1', 'fraggy1');
    const readMetadata = await readFragment('user1', 'fraggy1');
    const readData = await readFragmentData('user1', 'fraggy1');
    expect(readMetadata).toBeUndefined();
    expect(readData).toBeUndefined();
  });

  test('should throw an error if trying to delete non-existent fragment', async () => {
    await expect(deleteFragment('user1', 'nonExistentFrag')).rejects.toThrow();
  });
});
