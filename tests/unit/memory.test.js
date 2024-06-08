const {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
} = require('../../src/model/data/memory/index');

describe('Fragment Data Management', () => {
  // let fragmentMetadata;
  // let fragmentData;

  // beforeEach(() => {
  //   const fragmentMetadata = new MemoryDB();
  //   const fragmentData = new MemoryDB();
  // });



  test('should write and read fragment metadata', async () => {
    const fragment = { ownerId: 'user1', id: 'frag1', data: 'test' };
    await writeFragment(fragment);
    const readData = await readFragment('user1', 'frag1');
    expect(readData).toEqual(fragment);
  });

  test('should write and read fragment data', async () => {
    const buffer = Buffer.from('test data');
    await writeFragmentData('user1', 'frag1', buffer);
    const readData = await readFragmentData('user1', 'frag1');
    expect(readData).toEqual(buffer);
  });

  test('should list fragments for a user', async () => {
    const fragment1 = { ownerId: 'user1', id: 'frag1', data: 'test1' };
    const fragment2 = { ownerId: 'user1', id: 'frag2', data: 'test2' };
    await writeFragment(fragment1);
    await writeFragment(fragment2);
    const fragments = await listFragments('user1');
    expect(fragments).toEqual(['frag1', 'frag2']);
  });

  test('should list expanded fragments for a user', async () => {
    const fragment1 = { ownerId: 'user1', id: 'frag1', data: 'test1' };
    const fragment2 = { ownerId: 'user1', id: 'frag2', data: 'test2' };
    await writeFragment(fragment1);
    await writeFragment(fragment2);
    const fragments = await listFragments('user1', true);
    expect(fragments).toEqual([fragment1, fragment2]);
  });

  test('should delete a fragment', async () => {
    const fragment = { ownerId: 'user1', id: 'frag1', data: 'test' };
    await writeFragment(fragment);
    await writeFragmentData('user1', 'frag1', Buffer.from('test data'));
    await deleteFragment('user1', 'frag1');
    const readMetadata = await readFragment('user1', 'frag1');
    const readData = await readFragmentData('user1', 'frag1');
    expect(readMetadata).toBeUndefined();
    expect(readData).toBeUndefined();
  });

  test('should throw an error if trying to delete non-existent fragment', async () => {
    await expect(deleteFragment('user1', 'nonExistentFrag')).rejects.toThrow();
  });
});
